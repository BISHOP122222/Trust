import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Download, Edit, Trash2, Eye, MoreHorizontal, Package, AlertTriangle, CheckCircle, ChevronRight, Copy, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import AddProductModal from '@/components/modals/AddProductModal';
import { useToast } from '@/contexts/ToastContext';
import { useProducts, Product } from '@/contexts/ProductContext';
import { useSearch } from '@/contexts/SearchContext';
import { useUser } from '@/contexts/UserContext';
import Modal from '@/components/ui/Modal';
import { PowerBIKPICard } from '@/components/analytics/PowerBICharts';
import { cn } from '@/lib/utils';
import {
    SimpleDropdown,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@/components/ui/DropdownMenu';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/ExportUtils';

export default function Inventory() {
    const [searchParams] = useSearchParams();
    const { user } = useUser();
    const { products, deleteProduct, updateProduct, addProduct, loading, categories: contextCategories, pagination, refreshProducts } = useProducts();

    const isAdmin = user?.role === 'Owner';

    const { showToast } = useToast();
    const { searchQuery, setSearchQuery } = useSearch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'All');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const limit = 20;

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) setCategoryFilter(cat);
    }, [searchParams]);

    // Fetch products when pagination or filters change
    useEffect(() => {
        const catId = categoryFilter === 'All' ? '' : contextCategories.find(c => c.name === categoryFilter)?.id || '';
        refreshProducts(page, limit, searchQuery, catId);
    }, [page, categoryFilter, searchQuery]);

    const categories = ['All', ...contextCategories.map(c => c.name)];

    const lowStockCount = pagination.total > 0 ? products.filter(p => p.stock <= 10).length : 0; // Local page estimate or we need another API call
    const totalProducts = pagination.total;

    // Handlers
    const handleDelete = (id: string) => {
        if (window.confirm('Are you certain you want to delete this product? This action cannot be undone.')) {
            deleteProduct(id);
            showToast('Product deleted successfully');
        }
    };


    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (productData: FormData) => {
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
                showToast('Product updated successfully');
            } else {
                await addProduct(productData);
                showToast('New product added successfully');
            }
            setIsModalOpen(false);
        } catch (error: any) {
            showToast(error.message || 'Failed to save product', 'error');
        }
    };


    const handleToggleStatus = (id: string, currentStatus: boolean | undefined) => {
        const data = new FormData();
        data.append('status', String(!currentStatus));
        updateProduct(id, data);
        showToast(`Product marked as ${!currentStatus ? 'Active' : 'Inactive'}`, 'info');
    };


    const handleView = (product: Product) => {
        setViewingProduct(product);
        setIsViewModalOpen(true);
    };

    const handleDuplicate = async (product: Product) => {
        try {
            const formData = new FormData();
            formData.append('name', `${product.name} (Copy)`);
            formData.append('category', product.category);
            formData.append('price', String(product.price));
            formData.append('stock', '0');
            formData.append('sku', `${product.sku}-COPY`);

            await addProduct(formData);
            showToast('Product duplicated as draft', 'success');
        } catch (error: any) {
            showToast('Failed to duplicate product', 'error');
        }
    };

    const handleExportInventory = (format: string) => {
        setIsExporting(true);
        try {
            if (products.length === 0) {
                showToast('No product data to export', 'info');
                return;
            }

            const headers = ['Product Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'];
            const rows = products.map(p => [
                p.name,
                p.sku || 'N/A',
                p.category,
                p.price,
                p.stock,
                p.status !== false ? 'Active' : 'Inactive'
            ]);

            const fileName = `inventory_report_${new Date().toISOString().split('T')[0]}`;
            const title = "TRUST Stock Intelligence Report";

            if (format === 'CSV') {
                exportToCSV(rows, fileName, headers);
                showToast('Inventory report exported (CSV)', 'success');
            } else if (format === 'EXCEL') {
                exportToExcel(rows, fileName, headers);
                showToast('Inventory report exported (Excel)', 'success');
            } else if (format === 'PDF') {
                exportToPDF(rows, fileName, headers, title);
                showToast('Inventory report exported (PDF)', 'success');
            }
        } finally {
            setIsExporting(false);
            setIsExportModalOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            <AddProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProduct}
                initialData={editingProduct}
            />

            {/* View Product Modal (Quick Implementation) */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Product Details">
                {viewingProduct && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            {(viewingProduct as any).image ? (
                                <img src={(viewingProduct as any).image} alt={viewingProduct.name} className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
                            ) : (
                                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">No Img</div>
                            )}

                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{viewingProduct.name}</h3>
                                <p className="text-slate-500">{viewingProduct.sku}</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">{viewingProduct.category}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <div>
                                <p className="text-sm text-slate-500">Price</p>
                                <p className="font-bold text-slate-900">UGX {viewingProduct.price.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Stock</p>
                                <p className={`font-bold ${viewingProduct.stock <= 10 ? 'text-red-600' : 'text-slate-900'}`}>{viewingProduct.stock} units</p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Stock Intelligence</h1>
                    <p className="text-slate-500 font-medium">Manage your product catalog and supply levels</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        disabled={isExporting}
                        className="flex items-center gap-3 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 shadow-sm font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                    {isAdmin && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PowerBIKPICard
                    title="Total SKU Volume"
                    value={totalProducts}
                    trend="up"
                    trendValue="Active"
                    icon={Package}
                    colorClass="bg-blue-600"
                />
                <PowerBIKPICard
                    title="Low Stock Alerts"
                    value={lowStockCount}
                    trend="none"
                    trendValue="Immediate"
                    icon={AlertTriangle}
                    colorClass="bg-red-600"
                />
                <PowerBIKPICard
                    title="Top Categories"
                    value={contextCategories.length}
                    trend="up"
                    trendValue="Diverse"
                    icon={ChevronRight}
                    colorClass="bg-indigo-600"
                />
                <PowerBIKPICard
                    title="System Health"
                    value="100%"
                    trend="up"
                    trendValue="Optimal"
                    icon={CheckCircle}
                    colorClass="bg-emerald-600"
                />
            </div>

            <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white mt-10">
                <CardContent className="p-0">
                    {/* Advanced Filter Bar */}
                    <div className="p-8 border-b border-slate-100 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full max-w-xl group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, SKU, or category..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none min-w-[160px]">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-transparent rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white appearance-none cursor-pointer group-hover:bg-slate-100 transition-all"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-24">
                                <div className="inline-block w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Stock Data...</p>
                            </div>
                        ) : (
                            <>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Product Intelligence</th>
                                            <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">SKU Reference</th>
                                            <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Category</th>
                                            <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Market Price</th>
                                            <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Stock Availability</th>
                                            <th className="py-6 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {products.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-all group active:bg-slate-100/50">
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        {(item as any).image ? (
                                                            <div className="relative group/img">
                                                                <img src={(item as any).image} alt={item.name} className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shadow-md transition-transform group-hover/img:scale-110" />
                                                                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">Empty</div>
                                                        )}

                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit || 'Standard Unit'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <span className="font-mono text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">{item.sku || 'NO-SKU'}</span>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <span className="bg-indigo-50 text-indigo-600 text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest">{item.category}</span>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 text-base">UGX {item.price.toLocaleString()}</span>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">MSRP Reference</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", item.stock > 10 ? 'bg-emerald-500 shadow-emerald-200' : item.stock > 0 ? 'bg-orange-500 shadow-orange-200' : 'bg-red-500 shadow-red-200')}></div>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.stock > 10 ? 'Healthy' : item.stock > 0 ? 'Crit Low' : 'Out of Stock'}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400">{item.stock} / 100</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                                            <div
                                                                className={cn("h-full rounded-full transition-all duration-1000", item.stock > 10 ? 'bg-emerald-500' : item.stock > 0 ? 'bg-orange-500' : 'bg-red-500')}
                                                                style={{ width: `${Math.min(item.stock, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8 text-right">
                                                    <SimpleDropdown
                                                        trigger={
                                                            <button className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
                                                                <MoreHorizontal className="w-5 h-5" />
                                                            </button>
                                                        }
                                                    >
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(item.id, item.status)}>
                                                            <RefreshCw className="w-4 h-4" /> {item.status !== false ? 'Deactivate' : 'Activate'} Node
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleView(item)}>
                                                            <Eye className="w-4 h-4" /> View Logic
                                                        </DropdownMenuItem>
                                                        {isAdmin && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                                    <Edit className="w-4 h-4" /> Edit Core
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                                                                    <Copy className="w-4 h-4" /> Clone Node
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(item.id)}>
                                                                    <Trash2 className="w-4 h-4" /> Purge Item
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </SimpleDropdown>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100 bg-slate-50/30">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Showing <span className="text-slate-900">{(page - 1) * limit + 1}</span> — <span className="text-slate-900">{Math.min(page * limit, pagination.total)}</span> Of <span className="text-slate-900">{pagination.total}</span> Registered SKU
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-6 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            {[...Array(pagination.pages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setPage(i + 1)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-2xl text-[10px] font-black transition-all active:scale-90",
                                                        page === i + 1 ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-110' : 'text-slate-400 hover:bg-white hover:shadow-sm'
                                                    )}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                            disabled={page === pagination.pages}
                                            className="px-6 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Export Format Modal */}
            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Stock Intelligence Export">
                <div className="space-y-6 pt-2 text-center">
                    <p className="text-sm text-slate-500 font-medium italic">Select your preferred format for the inventory and stock intelligence report.</p>
                    <div className="grid grid-cols-3 gap-4">
                        {['CSV', 'EXCEL', 'PDF'].map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => handleExportInventory(fmt)}
                                className="flex flex-col items-center gap-3 p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group"
                            >
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Download className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{fmt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div >
    );
}
