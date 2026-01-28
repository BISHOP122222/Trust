import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Search, Eye, RefreshCw, ShoppingBag, ArrowUpRight, Calendar } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useSearch } from '@/contexts/SearchContext';
import Modal from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface ReturnRequest {
    id: string;
    orderId: string;
    item: string;
    reason: string;
    status: 'Approved' | 'Pending' | 'Rejected';
    date: string;
    amount: number;
}

export default function Returns() {
    const { showToast } = useToast();
    const { searchQuery, setSearchQuery } = useSearch();
    const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [returns, setReturns] = useState<ReturnRequest[]>([]);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/returns');
            const data = response.data.returns.map((r: any) => ({
                id: r.id.split('-')[0].toUpperCase(),
                orderId: r.orderId.split('-')[0].toUpperCase(),
                item: r.items?.[0]?.orderItem?.product?.name || 'Multiple Items',
                reason: r.reason,
                status: r.status === 'COMPLETED' ? 'Approved' : 'Pending',
                date: new Date(r.createdAt).toISOString(),
                amount: r.totalRefund
            }));
            setReturns(data);
        } catch (error) {
            console.error('Failed to fetch returns', error);
            showToast('Failed to load return history', 'error');
        } finally {
            setLoading(false);
        }
    };


    const filteredReturns = returns.filter(r =>
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Returns & Refunds</h1>
                    <p className="text-slate-500 font-medium mt-1">Reverse logistics and refund management center</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors pointer-events-none z-10" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by ID or Product..."
                            className="pl-11 pr-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:border-red-400 shadow-sm font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all w-64"
                        />
                    </div>
                    <button
                        onClick={fetchReturns}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-red-600 hover:border-red-200 shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Main Ledger Table */}
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initiated</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Item</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Refund Value</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReturns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 text-xs tracking-widest uppercase">RET-{ret.id}</span>
                                                <span className="text-[10px] font-bold text-red-500/70">From: ORD-{ret.orderId}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{new Date(ret.date).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(ret.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600 font-black text-[10px] border border-red-100">
                                                    R
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{ret.item}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 italic">Reason: {ret.reason}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-black text-slate-900 tracking-tighter text-base">UGX {ret.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                ret.status === 'Approved' ? "bg-emerald-50 text-emerald-600" :
                                                    ret.status === 'Pending' ? "bg-amber-50 text-amber-600" :
                                                        "bg-red-50 text-red-600"
                                            )}>
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    ret.status === 'Approved' ? "bg-emerald-500" :
                                                        ret.status === 'Pending' ? "bg-amber-500" :
                                                            "bg-red-500"
                                                )}></div>
                                                {ret.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => { setSelectedRequest(ret); setIsModalOpen(true); }}
                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReturns.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <ShoppingBag className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Returns Found</h3>
                                                <p className="text-slate-300 text-[10px] mt-2 font-bold max-w-[200px]">You haven't processed any refund requests matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Return Audit Details"
                className="max-w-md rounded-[2.5rem]"
            >
                {selectedRequest && (
                    <div className="space-y-8 p-2">
                        <div className="relative p-6 bg-slate-900 rounded-[2rem] overflow-hidden text-white shadow-2xl shadow-slate-200">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <ArrowUpRight className="w-32 h-32 rotate-12" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Total Refund Processed</p>
                                <h2 className="text-4xl font-black tracking-tighter">UGX {selectedRequest.amount.toLocaleString()}</h2>
                                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                                    <CheckCircle2 className="w-3 h-3" /> Settlement Success
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Return ID</p>
                                <p className="font-black text-slate-800 text-sm">RET-{selectedRequest.id}</p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin Order</p>
                                <p className="font-black text-blue-600 text-sm italic underline">ORD-{selectedRequest.orderId}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                                <div className="p-3 bg-red-50 rounded-xl text-red-600">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Formal Reason</p>
                                    <p className="text-sm font-bold text-slate-700 mt-1 leading-relaxed">"{selectedRequest.reason}"</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Timestamp</p>
                                    <p className="text-sm font-bold text-slate-700 mt-1">{new Date(selectedRequest.date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95"
                        >
                            Close Audit Review
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
