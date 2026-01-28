import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Smartphone, CreditCard, Banknote, Trash2, Plus, Minus,
    User, ArrowDownRight, ArrowUpDown, Laptop, Headphones, Camera,
    Gamepad2, Watch, Tv, Speaker, Signal, Box, ChevronRight, LayoutGrid,
    ShoppingCart, X, ShoppingBag
} from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import CheckoutModal from '@/components/modals/CheckoutModal';
import { useToast } from '@/contexts/ToastContext';
import { useProducts, Product } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { Tag, Sparkles, Check } from 'lucide-react';

type SortOption = 'name' | 'price-asc' | 'price-desc';

const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('smartphone') || n.includes('phone') || n.includes('tablet')) return <Smartphone className="w-4 h-4" />;
    if (n.includes('laptop') || n.includes('computer') || n.includes('desktop')) return <Laptop className="w-4 h-4" />;
    if (n.includes('audio') || n.includes('headphone') || n.includes('speaker')) return <Headphones className="w-4 h-4" />;
    if (n.includes('camera')) return <Camera className="w-4 h-4" />;
    if (n.includes('gaming')) return <Gamepad2 className="w-4 h-4" />;
    if (n.includes('wearable') || n.includes('watch')) return <Watch className="w-4 h-4" />;
    if (n.includes('tv') || n.includes('monitor') || n.includes('display')) return <Tv className="w-4 h-4" />;
    if (n.includes('appliance') || n.includes('home')) return <Speaker className="w-4 h-4" />;
    if (n.includes('networking')) return <Signal className="w-4 h-4" />;
    return <Box className="w-4 h-4" />;
};

export default function POS() {
    const { showToast } = useToast();
    const { products, categories } = useProducts();
    const { addSale } = useSales();

    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState<any[]>([]);
    const { searchQuery, setSearchQuery } = useSearch();
    const [cartSearchQuery, setCartSearchQuery] = useState('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'card'>('cash');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [discount, setDiscount] = useState<number>(0);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

    // New state for Cart visibility
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Serial Selection State
    const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
    const [serialProduct, setSerialProduct] = useState<any>(null);

    // Product Context Menu & Detail View
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, product: any } | null>(null);
    const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

    const handleProductContextMenu = (e: React.MouseEvent, product: any) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, product });
    };

    // Hierarchical category structure
    const categoryTree = useMemo(() => {
        const roots = categories.filter(c => !c.parentId);
        return roots.map(root => ({
            ...root,
            children: categories.filter(c => c.parentId === root.id)
        }));
    }, [categories]);

    const toggleParent = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedParents(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Customer Selection
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    useEffect(() => {
        api.get('/customers').then(res => setCustomers(res.data)).catch(console.error);
    }, []);

    const addToCart = (product: Product) => {
        if (product.stock === 0) {
            showToast('Item is out of stock', 'error');
            return;
        }

        if ((product as any).isSerialized) {
            setSerialProduct(product);
            setIsSerialModalOpen(true);
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && !item.serialItemId);
            if (existing) {
                if (existing.qty >= product.stock) {
                    showToast('Cannot add more than available stock', 'error');
                    return prev;
                }
                return prev.map(item => (item.id === product.id && !item.serialItemId) ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, id: product.id, name: product.name, price: product.price, qty: 1, image: product.image, discountAmount: 0 }];
        });
        showToast(`Added ${product.name} to cart`, 'success');
    };

    const addSerializedToCart = (product: any, serialItem: any) => {
        setCart(prev => [
            ...prev,
            {
                ...product,
                id: product.id,
                name: product.name,
                price: product.price,
                qty: 1,
                image: product.image,
                serialItemId: serialItem.id,
                serialNumber: serialItem.serialNumber,
                discountAmount: 0
            }
        ]);
        showToast(`Added ${product.name} (${serialItem.serialNumber}) to cart`, 'success');
        setIsSerialModalOpen(false);
    };

    const updateQty = (id: string, delta: number, serialItemId?: string) => {
        if (serialItemId) return;
        setCart(prev => prev.map(item => {
            if (item.id === id && !item.serialItemId) {
                const newQty = item.qty + delta;
                const product = products.find(p => p.id === id);
                if (product && newQty > product.stock) {
                    showToast('Cannot exceed available stock', 'error');
                    return item;
                }
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string, serialItemId?: string) => {
        setCart(prev => prev.filter(item => !(item.id === id && item.serialItemId === serialItemId)));
    };

    const clearCart = () => {
        if (window.confirm('Are you sure you want to clear the entire basket?')) {
            setCart([]);
            setDiscount(0);
        }
    };

    const updateItemDiscount = (id: string, serialItemId: string | undefined, disc: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id && item.serialItemId === serialItemId) {
                return { ...item, discountAmount: disc };
            }
            return item;
        }));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const itemDiscountsTotal = cart.reduce((acc, item) => acc + (item.discountAmount || 0), 0);

    // Dynamic Coupon Logic
    const couponDiscountAmount = useMemo(() => {
        if (!appliedDiscount) return 0;
        if (appliedDiscount.type === 'PERCENTAGE') {
            return (subtotal - itemDiscountsTotal) * (appliedDiscount.value / 100);
        } else if (appliedDiscount.type === 'FIXED_AMOUNT') {
            return appliedDiscount.value;
        }
        return 0; // BOGO logic usually handled differently, but for now we follow this
    }, [appliedDiscount, subtotal, itemDiscountsTotal]);

    const total = Math.max(0, subtotal - itemDiscountsTotal - discount - couponDiscountAmount);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            const res = await api.post('/discounts/validate', {
                code: couponCode,
                cartTotal: subtotal - itemDiscountsTotal
            });
            setAppliedDiscount(res.data.discount);
            showToast(`Coupon applied: ${res.data.discount.name}`, 'success');
        } catch (error: any) {
            setAppliedDiscount(null);
            showToast(error.response?.data?.message || 'Invalid coupon code', 'error');
        }
    };

    const filteredCart = useMemo(() => {
        return cart.filter(item =>
            item.name.toLowerCase().includes(cartSearchQuery.toLowerCase()) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(cartSearchQuery.toLowerCase()))
        );
    }, [cart, cartSearchQuery]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            setIsProcessing(true);
            const orderRes = await addSale({
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.qty,
                    serialItemId: item.serialItemId,
                    serialNumber: item.serialNumber,
                    discountAmount: item.discountAmount || 0
                })),
                paymentMethod: paymentMethod === 'momo' ? 'MOBILE_MONEY' : paymentMethod.toUpperCase(),
                discount: discount + couponDiscountAmount,
                discountId: appliedDiscount?.id,
                couponCode: appliedDiscount?.code,
                customerId: selectedCustomerId || undefined,
                total: total,
                subtotal: subtotal
            });

            setLastOrder(orderRes);
            setIsCheckoutOpen(true);
            showToast('Payment Successful! Receipt generated.');
            setCart([]);
            setDiscount(0);
            setIsCartOpen(false); // Close cart after success
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Transaction failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredProducts = useMemo(() => {
        let items = products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!searchMatch) return false;
            if (activeCategory === 'all') return true;
            const isDirectMatch = (p as any).categoryId === activeCategory;
            if (isDirectMatch) return true;
            const productCat = categories.find(c => c.id === (p as any).categoryId);
            if (productCat && productCat.parentId === activeCategory) return true;
            return false;
        });

        if (sortBy === 'price-asc') items.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-desc') items.sort((a, b) => b.price - a.price);
        else items.sort((a, b) => a.name.localeCompare(b.name));

        return items;
    }, [products, activeCategory, searchQuery, sortBy, categories]);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] gap-6 p-1 overflow-hidden relative">

            {/* Main Content: Expanded Product Grid */}
            <div className="flex-1 flex flex-col min-w-0 gap-6 transition-all duration-300">

                {/* Header: Search & Sort */}
                <div className="bg-white/80 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] border border-slate-200/60 flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search everything or scan barcode..."
                            className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all font-black"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex bg-slate-50/50 p-1.5 rounded-[1.5rem] border border-slate-100 overflow-x-auto">
                        {['name', 'price-asc', 'price-desc'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setSortBy(opt as SortOption)}
                                className={cn(
                                    "flex-1 md:flex-none px-4 md:px-6 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap",
                                    sortBy === opt
                                        ? "bg-white text-primary shadow-md shadow-primary/5"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {opt === 'name' && <ArrowUpDown className="w-3.5 h-3.5" />}
                                {opt === 'price-asc' && <ArrowDownRight className="w-3.5 h-3.5" />}
                                {opt === 'price-desc' && <ArrowDownRight className="w-3.5 h-3.5 rotate-[-90deg]" />}
                                {opt.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Category Sidebar */}
                    <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden pr-0 md:pr-2 pb-2 md:pb-0 scrollbar-none hover:scrollbar-thin scrollbar-thumb-slate-200 transition-all shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveCategory('all')}
                            className={cn(
                                "min-w-[140px] md:min-w-0 w-auto md:w-full text-left px-5 py-4 rounded-[1.5rem] text-[10px] font-black transition-all flex items-center gap-4 uppercase tracking-[0.2em] shrink-0",
                                activeCategory === 'all'
                                    ? "bg-primary text-white shadow-xl shadow-primary/20 border-transparent"
                                    : "bg-white border border-slate-100 text-slate-400 hover:text-slate-800"
                            )}
                        >
                            <LayoutGrid className={cn("w-5 h-5", activeCategory === 'all' ? "opacity-100" : "opacity-40")} />
                            <span className="whitespace-nowrap">All Items</span>
                        </motion.button>

                        <div className="flex flex-row md:flex-col gap-2 md:mt-4 md:space-y-2">
                            <h4 className="hidden md:block px-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Categories</h4>
                            {categoryTree.map(parent => (
                                <div key={parent.id} className="min-w-[160px] md:min-w-0 md:w-full space-y-2 px-1 shrink-0">
                                    <motion.button
                                        whileHover={{ x: 4 }}
                                        onClick={() => setActiveCategory(parent.id)}
                                        className={cn(
                                            "w-full text-left px-4 py-3.5 rounded-2xl text-[11px] font-black transition-all flex items-center justify-between group uppercase tracking-[0.1em]",
                                            activeCategory === parent.id
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-white border border-slate-100 text-slate-600 hover:border-primary/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-xl transition-colors",
                                                activeCategory === parent.id ? "bg-white/20" : "bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary"
                                            )}>
                                                {getCategoryIcon(parent.name)}
                                            </div>
                                            <span className="truncate">{parent.name}</span>
                                        </div>
                                        {/* Hide Chevron on mobile for cleaner look or keep it */}
                                        {parent.children.length > 0 && (
                                            <div
                                                onClick={(e) => toggleParent(parent.id, e)}
                                                className={cn(
                                                    "hidden md:block p-1.5 rounded-lg transition-colors", // Hidden on horizontal scroll
                                                    activeCategory === parent.id ? "hover:bg-white/20" : "hover:bg-slate-50 text-slate-300"
                                                )}
                                            >
                                                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", expandedParents.has(parent.id) && "rotate-90")} />
                                            </div>
                                        )}
                                    </motion.button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-none hover:scrollbar-thin scrollbar-thumb-slate-200">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-32 pt-1 transition-all duration-300">
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.map(product => (
                                    <motion.button
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ y: -8 }}
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        onContextMenu={(e) => handleProductContextMenu(e, product)}
                                        className="bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col items-start hover:border-primary/50 hover:shadow-[0_25px_50px_-12px_rgba(var(--color-primary-rgb),0.1)] transition-all group text-left relative overflow-hidden h-full min-h-[350px] bg-gradient-to-b from-white to-slate-50/30"
                                    >
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 backdrop-blur-[2px]">
                                                <span className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] shadow-xl">Out of stock</span>
                                            </div>
                                        )}

                                        <div className="w-full aspect-square bg-white rounded-[1.5rem] mb-6 flex items-center justify-center overflow-hidden relative shadow-sm border border-slate-50">
                                            <img
                                                src={product.image || 'https://placehold.co/400x400?text=Product'}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            {product.stock > 0 && product.stock <= 5 && (
                                                <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                                                    Low Stock
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 w-full flex flex-col">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-primary/5 text-primary rounded-md text-[8px] font-black uppercase tracking-[0.1em]">
                                                    {categories.find(c => c.id === (product as any).categoryId)?.name || 'General'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {product.stock} units
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-800 text-[13px] leading-[1.6] mb-4 group-hover:text-primary transition-colors uppercase tracking-tight">
                                                {product.name}
                                            </h3>

                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between w-full">
                                                <div className="flex flex-col">
                                                    <p className="font-black text-slate-900 text-[18px] tracking-tighter">
                                                        <span className="text-[10px] mr-1 text-slate-400 font-black uppercase tracking-tight italic">UGX</span>
                                                        {product.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 bg-slate-100 group-hover:bg-primary group-hover:text-white rounded-xl flex items-center justify-center transition-all group-hover:rotate-90">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Cart Button */}
            <motion.button
                initial={{ scale: 0, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-10 right-10 z-50 bg-slate-900 text-white p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 group overflow-hidden border border-slate-700/50"
            >
                <div className="bg-primary p-5 rounded-[2.2rem] flex items-center justify-center relative shadow-lg shadow-primary/20">
                    <ShoppingCart className="w-8 h-8" />
                    <AnimatePresence>
                        {cart.length > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full border-[3px] border-primary flex items-center justify-center shadow-lg"
                            >
                                {cart.length}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex flex-col items-start pr-6 pl-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Ready to pay</span>
                    <span className="text-xl font-black tracking-tighter">UGX {total.toLocaleString()}</span>
                </div>
            </motion.button>

            {/* Grand Checkout View (Centered Large Modal) */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 lg:p-12">
                        {/* Perfect Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl cursor-crosshair"
                        />

                        {/* Grand Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-[1100px] h-full max-h-[800px] bg-white rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Checkout Review</h2>
                                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">Summary • {cart.length} Items</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {cart.length > 0 && (
                                        <button
                                            onClick={clearCart}
                                            className="px-4 py-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                        >
                                            Clear Basket
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="w-10 h-10 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm flex items-center justify-center group"
                                    >
                                        <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                                    </button>
                                </div>
                            </div>

                            {/* Main Content Area (2-Column) */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Left Column: Product List */}
                                <div className="flex-[2.8] flex flex-col min-w-0 bg-white">
                                    {/* Cart Search Bar */}
                                    <div className="px-8 py-3 border-b border-slate-50 bg-slate-50/20">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Quick find items..."
                                                value={cartSearchQuery}
                                                onChange={(e) => setCartSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors bg-slate-50/30">
                                        <AnimatePresence mode="popLayout">
                                            {filteredCart.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-40">
                                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                                                        <ShoppingBag className="w-10 h-10 text-slate-200" />
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
                                                        Your basket is empty
                                                    </h3>
                                                </div>
                                            ) : (
                                                filteredCart.map((item) => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        key={item.serialItemId || item.id}
                                                        className="flex gap-6 p-5 bg-white rounded-[1.5rem] border border-slate-100 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all group items-center relative"
                                                    >
                                                        {/* Standard Product Image */}
                                                        <div className="w-20 h-20 bg-slate-50 rounded-2xl shrink-0 overflow-hidden border border-slate-100 p-2">
                                                            <img src={item.image || 'https://placehold.co/100x100?text=Product'} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
                                                        </div>

                                                        {/* Product Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                                                                    {categories.find(c => c.id === (item as any).categoryId)?.name || 'Product'}
                                                                </span>
                                                                {item.serialNumber && (
                                                                    <span className="text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">
                                                                        ID: {item.serialNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{item.name}</h4>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                                    UGX {item.price.toLocaleString()}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                                                                    <span className="text-[8px] font-black text-orange-500 uppercase">Disc</span>
                                                                    <input
                                                                        type="number"
                                                                        value={item.discountAmount || 0}
                                                                        onChange={(e) => updateItemDiscount(item.id, item.serialItemId, Number(e.target.value))}
                                                                        className="w-12 bg-transparent text-right text-[10px] font-black focus:outline-none"
                                                                        min="0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50 shrink-0">
                                                            <button
                                                                onClick={() => updateQty(item.id, -1, item.serialItemId)}
                                                                className={cn("w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-sm", item.serialItemId && "opacity-20 cursor-not-allowed")}
                                                            >
                                                                <Minus className="w-3.5 h-3.5" />
                                                            </button>
                                                            <span className="text-xs font-black w-8 text-center text-slate-900 leading-none">{item.qty}</span>
                                                            <button
                                                                onClick={() => updateQty(item.id, 1, item.serialItemId)}
                                                                className={cn("w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-all shadow-sm", item.serialItemId && "opacity-20 cursor-not-allowed")}
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Price Display Area */}
                                                        <div className="text-right min-w-[120px] shrink-0 border-l border-slate-100 pl-6">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none opacity-50">Line Total</p>
                                                            <p className="font-black text-slate-900 text-lg tracking-tighter leading-none">
                                                                <span className="text-[10px] mr-1 text-slate-300 italic">UGX</span>
                                                                {((item.price * item.qty) - (item.discountAmount || 0)).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Remove Button */}
                                                        <button
                                                            onClick={() => removeFromCart(item.id, item.serialItemId)}
                                                            className="absolute -top-2 -right-2 w-8 h-8 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-300 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 border border-slate-100 hover:rotate-12"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Right Column: Summary & Payment (Premium) */}
                                <div className="flex-[1.2] bg-white border-l border-slate-100 p-8 flex flex-col overflow-y-auto scrollbar-none">
                                    <div className="space-y-8">
                                        {/* Customer Selection */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billing Customer</p>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                </div>
                                                <select
                                                    className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white appearance-none cursor-pointer"
                                                    value={selectedCustomerId || ''}
                                                    onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                                                >
                                                    <option value="">Walk-In Transaction</option>
                                                    {customers.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-300">
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Summary */}
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Summary</p>
                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                    <span className="uppercase tracking-widest">Gross Total</span>
                                                    <span className="font-black text-slate-800">UGX {subtotal.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Discount</span>
                                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm focus-within:border-orange-500 transition-all">
                                                        <span className="text-[9px] font-black text-orange-500">UGX</span>
                                                        <input
                                                            type="number"
                                                            value={discount}
                                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                                            className="w-20 bg-transparent text-right text-xs font-black focus:outline-none"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coupon Protocol</span>
                                                        {appliedDiscount && (
                                                            <button
                                                                onClick={() => { setAppliedDiscount(null); setCouponCode(''); }}
                                                                className="text-[8px] font-black text-red-500 uppercase hover:underline"
                                                            >
                                                                Detach
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Tag className={cn("w-3.5 h-3.5 transition-colors", appliedDiscount ? "text-primary" : "text-slate-300")} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                            disabled={!!appliedDiscount}
                                                            placeholder="ENTER CODE..."
                                                            className="w-full pl-9 pr-12 py-3 bg-white border border-slate-100 rounded-[1.2rem] text-[10px] font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all uppercase disabled:bg-primary/5 disabled:text-primary disabled:border-primary/20 placeholder:text-slate-200"
                                                        />
                                                        {!appliedDiscount ? (
                                                            <button
                                                                onClick={handleApplyCoupon}
                                                                className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 text-white rounded-[1rem] text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                                                            >
                                                                Apply
                                                            </button>
                                                        ) : (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                                                                    <Check className="w-3 h-3" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {appliedDiscount && (
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl border border-primary/20">
                                                            <Sparkles className="w-3 h-3 text-primary" />
                                                            <p className="text-[9px] font-black text-primary uppercase tracking-wider">
                                                                - UGX {couponDiscountAmount.toLocaleString()} Savings Active
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-4 mt-2 border-t border-slate-200/50 flex flex-col gap-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</span>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-black text-primary tracking-tighter leading-none">
                                                                <span className="text-[10px] mr-1 italic opacity-40">UGX</span>
                                                                {total.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Methods */}
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Type</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'cash', icon: Banknote, label: 'CASH', color: 'blue' },
                                                    { id: 'momo', icon: Smartphone, label: 'MOMO', color: 'emerald' },
                                                    { id: 'card', icon: CreditCard, label: 'CARD', color: 'orange' }
                                                ].map((method) => (
                                                    <motion.button
                                                        key={method.id}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setPaymentMethod(method.id as any)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center gap-2 py-5 rounded-[1.5rem] border-[2px] transition-all relative overflow-hidden",
                                                            paymentMethod === method.id
                                                                ? "bg-slate-900 border-slate-900 text-white shadow-xl"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                                                        )}
                                                    >
                                                        <method.icon className={cn("w-6 h-6", paymentMethod === method.id ? "text-primary" : "opacity-40")} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                                                        {paymentMethod === method.id && (
                                                            <motion.div layoutId="activeMethod" className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="mt-auto pt-8">
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleCheckout}
                                            disabled={cart.length === 0 || isProcessing}
                                            className={cn(
                                                "w-full py-6 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-4 relative overflow-hidden shadow-2xl shadow-primary/20",
                                                cart.length === 0 || isProcessing
                                                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                                    : "bg-primary text-white hover:bg-primary/90"
                                            )}
                                        >
                                            <span className="relative z-10">{isProcessing ? 'PROCESSING...' : 'COMPLETE TRANSACTION'}</span>
                                            <ArrowDownRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                                        </motion.button>
                                        <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-4 opacity-1/2">
                                            Press Enter to finalize quickly
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => {
                    setIsCheckoutOpen(false);
                    setLastOrder(null);
                }}
                order={lastOrder}
            />

            {/* Serial Selection Modal */}
            <Modal isOpen={isSerialModalOpen} onClose={() => setIsSerialModalOpen(false)} title="Unit Specification Required" className="max-w-md">
                <div className="space-y-6 p-2">
                    <div className="bg-blue-600/5 p-5 rounded-3xl border border-blue-600/10">
                        <p className="text-sm text-blue-900 font-black mb-1 flex items-center gap-2">
                            <Box className="w-4 h-4" />
                            Serialized Inventory
                        </p>
                        <p className="text-xs text-blue-600/80 font-bold">Please select the specific unit ID for <span className="text-blue-900 underline underline-offset-4">{serialProduct?.name}</span> to ensure accurate tracking.</p>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-none hover:scrollbar-thin">
                        {serialProduct?.serialItems?.filter((s: any) => s.status === 'AVAILABLE').map((serial: any, i: number) => (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={serial.id}
                                onClick={() => addSerializedToCart(serialProduct, serial)}
                                className="w-full p-5 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-between hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                        <Signal className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Item ID</p>
                                        <p className="font-mono text-base font-black text-slate-800 tracking-tight">{serial.serialNumber}</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                    <Plus className="w-6 h-6" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </Modal>
            {/* Product Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                            className="fixed z-[120] min-w-[200px] bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-2"
                        >
                            <div className="px-4 py-3 border-b border-slate-100 mb-2">
                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest truncate">{contextMenu.product.name}</p>
                            </div>
                            <button
                                onClick={() => { addToCart(contextMenu.product); setContextMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-slate-700 hover:bg-blue-600 hover:text-white transition-all"
                            >
                                <Plus className="w-4 h-4" /> Add to Basket
                            </button>
                            <button
                                onClick={() => { setSelectedProductDetail(contextMenu.product); setContextMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-slate-700 hover:bg-slate-50 transition-all"
                            >
                                <Search className="w-4 h-4" /> View Details
                            </button>
                            {/* Admin only action placeholder */}
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-slate-400 cursor-not-allowed italic">
                                <LayoutGrid className="w-4 h-4" /> Modify Stock
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Product Detail Modal */}
            <Modal
                isOpen={!!selectedProductDetail}
                onClose={() => setSelectedProductDetail(null)}
                title="Product Intelligence"
                className="max-w-3xl"
            >
                {selectedProductDetail && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                        <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 p-6 flex items-center justify-center">
                            <img src={selectedProductDetail.image || 'https://placehold.co/400x400'} className="w-full h-full object-cover mix-blend-multiply" alt={selectedProductDetail.name} />
                        </div>
                        <div className="space-y-6 flex flex-col justify-center">
                            <div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {categories.find(c => c.id === (selectedProductDetail as any).categoryId)?.name || 'General'}
                                </span>
                                <h3 className="text-3xl font-black text-slate-800 mt-4 leading-tight uppercase tracking-tighter">
                                    {selectedProductDetail.name}
                                </h3>
                                <p className="text-slate-400 font-bold text-sm mt-2">
                                    SKU: {selectedProductDetail.sku || 'TRU-000-X'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">List Price</p>
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                            <span className="text-base mr-1 text-slate-300">UGX</span>
                                            {selectedProductDetail.price.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Status</p>
                                        <span className={cn(
                                            "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border",
                                            selectedProductDetail.stock > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                                        )}>
                                            {selectedProductDetail.stock} Available
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { addToCart(selectedProductDetail); setSelectedProductDetail(null); }}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3"
                                >
                                    <ShoppingCart className="w-5 h-5" /> Add to current sale
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
