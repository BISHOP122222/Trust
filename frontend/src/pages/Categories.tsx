import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Edit2, Trash2, ChevronRight, PieChart, ShoppingBag, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { useProducts, Category } from '@/contexts/ProductContext';
import { useToast } from '@/contexts/ToastContext';
import { useUser } from '@/contexts/UserContext';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';

const getCategoryColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('phone') || n.includes('mobile')) return 'from-primary/60 to-primary';
    if (n.includes('laptop') || n.includes('computer')) return 'from-indigo-400 to-indigo-600';
    if (n.includes('audio') || n.includes('music') || n.includes('speaker')) return 'from-emerald-400 to-emerald-600';
    if (n.includes('camera') || n.includes('photo')) return 'from-orange-400 to-orange-600';
    if (n.includes('game') || n.includes('play')) return 'from-rose-400 to-rose-600';
    if (n.includes('access') || n.includes('cable')) return 'from-amber-400 to-amber-600';
    if (n.includes('tablet') || n.includes('pad')) return 'from-purple-400 to-purple-600';
    if (n.includes('watch') || n.includes('wear')) return 'from-cyan-400 to-cyan-600';
    return 'from-slate-400 to-slate-600';
};

export default function Categories() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { categories, addCategory, updateCategory, deleteCategory } = useProducts();
    const [page, setPage] = useState(1);
    const limit = 8;

    const isAdmin = user?.role === 'Owner';
    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newParentId, setNewParentId] = useState<string>('');
    const [categoryStats, setCategoryStats] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/categories/stats');
                setCategoryStats(response.data);
            } catch (error) {
                console.error('Failed to fetch category stats:', error);
                setCategoryStats(categories.map(c => ({ ...c, count: 0, sales: 'UGX 0' })));
            }
        };
        fetchStats();
    }, [categories]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        if (editingCategory) {
            updateCategory(editingCategory.id, { name: newCategoryName, parentId: newParentId || undefined });
            showToast('Category updated successfully');
        } else {
            addCategory(newCategoryName, newParentId || undefined);
            showToast('Category added successfully');
        }

        setIsModalOpen(false);
        setNewCategoryName('');
        setNewParentId('');
        setEditingCategory(null);
    };

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
        setNewParentId(cat.parentId || '');
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this category? Products in this category will remain but their category label might need updating.')) {
            deleteCategory(id);
            showToast('Category deleted successfully');
        }
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setNewCategoryName('');
        setNewParentId('');
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header section with stats summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Category Management</h1>
                    <p className="text-slate-500 font-medium mt-1">Organize and track performance of your product catalogs.</p>
                </div>
                {isAdmin && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold font-sm shadow-xl shadow-primary/20 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Category
                    </motion.button>
                )}
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Categories', value: categories.length, icon: PieChart, color: 'text-primary bg-primary/10' },
                    { label: 'Active Subcategories', value: categories.filter(c => c.parentId).length, icon: Folder, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Total Inventory Items', value: categoryStats.reduce((acc, c) => acc + (c.count || 0), 0), icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.color)}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Grid of Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {categoryStats.slice((page - 1) * limit, page * limit).map((category) => (
                        <motion.div
                            key={category.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -5 }}
                            className="cursor-pointer"
                            onClick={() => navigate(`/inventory?category=${encodeURIComponent(category.name)}`)}
                        >
                            <Card className="border-none shadow-sm h-full group hover:shadow-2xl hover:shadow-primary/10 transition-all bg-white rounded-[2.5rem]">
                                <CardContent className="p-6 relative z-10 flex flex-col h-full min-h-[250px]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 duration-500 bg-gradient-to-br",
                                            getCategoryColor(category.name)
                                        )}>
                                            <Folder className="w-6 h-6" />
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                                                    className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-white rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm border border-slate-100"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                                                    className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-white rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm border border-slate-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {category.parentId && (
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">Sub</span>
                                            )}
                                            <h3 className="text-lg font-semibold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">{category.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                            <p className="text-xs font-bold">{category.count || 0} Products Managed</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Stock Value/Sales</p>
                                            <p className="text-lg font-black text-slate-900">{category.sales || 'UGX 0'}</p>
                                        </div>
                                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner group-hover:shadow-primary/20">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {categoryStats.length > limit && (
                <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-8 rounded-[2rem] shadow-sm border border-white/20">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Displaying <span className="text-slate-900">{Math.min(categoryStats.length, limit)}</span> Catalog Nodes Per Page
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-6 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white disabled:opacity-30 transition-all active:scale-95"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(Math.ceil(categoryStats.length / limit), p + 1))}
                            disabled={page >= Math.ceil(categoryStats.length / limit)}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95"
                        >
                            Next Catalog
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Category Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? "Update Classification" : "Catalog New Category"}
                className="max-w-xl"
            >
                <form onSubmit={handleSave} className="space-y-6 p-2">
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Category Name</label>
                            <input
                                autoFocus
                                type="text"
                                required
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Next-Gen Computing"
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Hierarchical Position</label>
                            <div className="relative">
                                <select
                                    value={newParentId}
                                    onChange={(e) => setNewParentId(e.target.value)}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm cursor-pointer"
                                >
                                    <option value="">Standard (Top Level Root)</option>
                                    {categories
                                        .filter(c => c.id !== editingCategory?.id)
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>Nested under: {cat.name}</option>
                                        ))
                                    }
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-4 text-sm font-black text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 text-sm font-black text-white bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 transition-all uppercase tracking-widest"
                        >
                            {editingCategory ? 'Update' : 'Confirm'} Classification
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
