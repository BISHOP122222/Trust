import { useState, useEffect } from 'react';
import { Plus, Tag, Calendar, Trash2, Edit2, Percent, DollarSign, Search, Gift } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { Card, CardContent } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Discount {
    id: string;
    code: string;
    name: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO';
    value: number;
    used?: number;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
}

export default function Discounts() {
    const { showToast } = useToast();
    const { searchQuery, setSearchQuery } = useSearch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO',
        value: 0,
        isActive: true
    });

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/discounts');
            setDiscounts(response.data);
        } catch (error) {
            console.error('Failed to fetch discounts', error);
            showToast('Failed to load discounts', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/discounts', formData);
            setDiscounts([response.data, ...discounts]);
            showToast('Discount created successfully!', 'success');
            setIsModalOpen(false);
            setFormData({ name: '', code: '', description: '', type: 'PERCENTAGE', value: 0, isActive: true });
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to create discount', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this discount?')) {
            try {
                await api.delete(`/discounts/${id}`);
                setDiscounts(discounts.filter(d => d.id !== id));
                showToast('Discount deleted');
            } catch (error) {
                showToast('Failed to delete discount', 'error');
            }
        }
    };

    const filteredDiscounts = discounts.filter(d =>
        (d.code?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (d.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (d.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (d: Discount) => {
        if (!d.isActive) return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Incentives</h1>
                    <p className="text-slate-500 font-medium">Manage and monitor promotional performance</p>
                </div>
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    <div className="relative group flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find code or name..."
                            className="w-full lg:w-64 pl-12 pr-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:border-blue-400 shadow-sm font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 font-black text-xs uppercase tracking-widest transition-all active:scale-95 group"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                        Create Incentive
                    </button>
                </div>
            </div>

            {/* Grid of Discounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="h-64 border-none shadow-sm bg-slate-50 animate-pulse rounded-[2rem]" />
                    ))
                ) : filteredDiscounts.length > 0 ? (
                    filteredDiscounts.map(discount => (
                        <Card key={discount.id} className="border-none shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all bg-white rounded-[2.5rem]">
                            <CardContent className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500 bg-gradient-to-br",
                                        discount.type === 'PERCENTAGE' ? 'from-blue-500 to-blue-700 text-white' :
                                            discount.type === 'FIXED_AMOUNT' ? 'from-emerald-500 to-emerald-700 text-white' :
                                                'from-orange-500 to-orange-700 text-white'
                                    )}>
                                        {discount.type === 'PERCENTAGE' ? <Percent className="w-7 h-7" /> :
                                            discount.type === 'FIXED_AMOUNT' ? <DollarSign className="w-7 h-7" /> :
                                                <Gift className="w-7 h-7" />}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        <button className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-white rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-slate-100">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(discount.id)}
                                            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-white rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm border border-slate-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{discount.code}</span>
                                        <div className={cn("w-2 h-2 rounded-full", discount.isActive ? "bg-emerald-500" : "bg-red-500")} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{discount.name}</h3>
                                    <p className="text-sm text-slate-400 font-medium line-clamp-2">{discount.description}</p>
                                </div>

                                <div className="mt-8 flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Incentive Yield</p>
                                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                            {discount.type === 'PERCENTAGE' ? `${discount.value}%` :
                                                discount.type === 'FIXED_AMOUNT' ? `UGX ${discount.value.toLocaleString()}` :
                                                    'BOGO'}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                        getStatusColor(discount)
                                    )}>
                                        {discount.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-300" />
                                        <span>Lifetime: No Expiry</span>
                                    </div>
                                    <div className="text-blue-500/30">TRUST INTELLIGENCE</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <Tag className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest">No incentives identified</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Protocol Deployment"
                className="max-w-2xl"
            >
                <form onSubmit={handleCreate} className="space-y-8 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Incentive Title</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Flash Clearance"
                                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Protocol Code</label>
                            <input
                                required
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. TRUST50"
                                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Incentive Logic</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'PERCENTAGE', label: 'Percent', icon: Percent },
                                { id: 'FIXED_AMOUNT', label: 'Fixed', icon: DollarSign },
                                { id: 'BOGO', label: 'BOGO', icon: Gift }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t.id as any })}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all group",
                                        formData.type === t.id ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-200" : "bg-slate-50 border-transparent hover:bg-slate-100"
                                    )}
                                >
                                    <t.icon className={cn("w-6 h-6", formData.type === t.id ? "text-white" : "text-slate-400")} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", formData.type === t.id ? "text-white" : "text-slate-500")}>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Yield Value</label>
                            <input
                                type="number"
                                required
                                disabled={formData.type === 'BOGO'}
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                placeholder={formData.type === 'PERCENTAGE' ? '15' : '50000'}
                                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Initial Status</label>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={cn(
                                    "w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center",
                                    formData.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                                )}
                            >
                                {formData.isActive ? 'Active Deployment' : 'Staged/Inactive'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Contextual Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the trigger and objective of this incentive..."
                            className="w-full h-24 px-5 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Deploy Incentive
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
