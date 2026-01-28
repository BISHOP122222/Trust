import { useState, useMemo } from 'react';
import { Search, Eye, Calendar, Package, CheckCircle, Clock, XCircle, RefreshCw, FileText, Info, Download, ChevronRight } from 'lucide-react';
import { useSales, Sale } from '@/contexts/SalesContext';
import { useSearch } from '@/contexts/SearchContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { PowerBIKPICard } from '@/components/analytics/PowerBICharts';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/ExportUtils';

export default function Orders() {
    const { sales } = useSales();
    const { searchQuery, setSearchQuery } = useSearch();
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [dateRange, setDateRange] = useState('This Week');

    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [returnReason, setReturnReason] = useState('');
    const [returningItems, setReturningItems] = useState<{ orderItemId: string; quantity: number }[]>([]);
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const { showToast } = useToast();

    // Derived Data for Summary Cards
    const totalOrders = sales.length;
    const completedOrders = sales.filter(s => s.status === 'COMPLETED').length;
    const pendingOrders = sales.filter(s => s.status === 'PENDING').length;
    const cancelledOrders = sales.filter(s => s.status === 'CANCELLED').length;

    const priceRange = { min: 0, max: 100000000 };

    const filteredOrders = useMemo(() => {
        return sales.filter(order => {
            const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Completed' && order.status === 'COMPLETED') ||
                (statusFilter === 'Pending' && order.status === 'PENDING') ||
                (statusFilter === 'Cancelled' && order.status === 'CANCELLED');

            const matchesPayment = paymentFilter === 'All' ||
                order.paymentMethod?.toUpperCase() === paymentFilter.toUpperCase();

            const orderTotal = order.total || 0;
            const matchesPrice = orderTotal >= priceRange.min && orderTotal <= priceRange.max;

            if (dateRange === 'Today') {
                const today = new Date();
                const orderDate = new Date(order.date);
                if (today.toDateString() !== orderDate.toDateString()) return false;
            }

            return matchesSearch && matchesStatus && matchesPayment && matchesPrice;
        });
    }, [sales, searchQuery, statusFilter, paymentFilter, priceRange, dateRange]);

    const handleViewDetails = (order: Sale) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleInitiateReturn = (order: Sale) => {
        setSelectedOrder(order);
        setReturnReason('');
        setReturningItems(order.items.map(item => ({
            orderItemId: item.id,
            quantity: item.qty
        })));
        setIsReturnModalOpen(true);
    };

    const handleReturnQuantityChange = (orderItemId: string, qty: number) => {
        setReturningItems(prev => prev.map(item =>
            item.orderItemId === orderItemId ? { ...item, quantity: qty } : item
        ));
    };

    const submitReturn = async () => {
        if (!selectedOrder) return;
        if (!returnReason.trim()) {
            showToast('Please provide a reason for the return', 'error');
            return;
        }
        const itemsToReturn = returningItems.filter(item => item.quantity > 0);
        if (itemsToReturn.length === 0) {
            showToast('Please select at least one item to return', 'error');
            return;
        }
        try {
            setIsSubmittingReturn(true);
            await api.post('/returns', {
                orderId: selectedOrder.id,
                reason: returnReason,
                items: itemsToReturn
            });
            showToast('Return processed successfully', 'success');
            setIsReturnModalOpen(false);
            setIsModalOpen(false);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to process return', 'error');
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    const handleExport = (format: string) => {
        if (filteredOrders.length === 0) {
            showToast('No orders to export with current filters', 'info');
            return;
        }

        const headers = ['Order ID', 'Date', 'Customer', 'Items Count', 'Payment Method', 'Discount', 'Total Amount', 'Status'];
        const rows = filteredOrders.map(s => [
            s.id,
            new Date(s.date).toLocaleString(),
            'Walk-in Customer',
            s.items.length,
            s.paymentMethod,
            s.discount || 0,
            s.total,
            s.status || 'COMPLETED'
        ]);

        const fileName = `orders_report_${new Date().toISOString().split('T')[0]}`;
        const title = "TRUST Transaction Intelligence Report";

        if (format === 'CSV') exportToCSV(rows, fileName, headers);
        else if (format === 'EXCEL') exportToExcel(rows, fileName, headers);
        else if (format === 'PDF') exportToPDF(rows, fileName, headers, title);

        showToast(`Orders report exported (${format})`, 'success');
        setIsExportModalOpen(false);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Order Management</h1>
                    <p className="text-slate-500 font-medium">Track and analyze all historical transactions</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none z-10" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="pl-11 pr-10 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:border-blue-400 shadow-sm font-black text-xs uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                        >
                            <option>All Time</option>
                            <option>Today</option>
                            <option>This Week</option>
                            <option>This Month</option>
                            <option>This Year</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none transition-transform group-hover:text-blue-500" />
                    </div>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 font-black text-xs uppercase tracking-widest transition-all active:scale-95 group"
                    >
                        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PowerBIKPICard
                    title="Total Volume"
                    value={totalOrders}
                    trend="up"
                    trendValue="Active"
                    icon={Package}
                    colorClass="bg-blue-600"
                />
                <PowerBIKPICard
                    title="Completed"
                    value={completedOrders}
                    trend="up"
                    trendValue="Success"
                    icon={CheckCircle}
                    colorClass="bg-emerald-600"
                />
                <PowerBIKPICard
                    title="Active Pending"
                    value={pendingOrders}
                    trend="none"
                    trendValue="Attention"
                    icon={Clock}
                    colorClass="bg-amber-600"
                />
                <PowerBIKPICard
                    title="Cancellations"
                    value={cancelledOrders}
                    trend="down"
                    trendValue="Low Risk"
                    icon={XCircle}
                    colorClass="bg-red-600"
                />
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white">
                <div className="p-8 border-b border-slate-100 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full max-w-xl group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by Order ID or Product name..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none min-w-[140px]">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-transparent rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white appearance-none cursor-pointer group-hover:bg-slate-100 transition-all"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                            </div>

                            <div className="relative flex-1 md:flex-none min-w-[140px]">
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-transparent rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white appearance-none cursor-pointer group-hover:bg-slate-100 transition-all"
                                >
                                    <option value="All">All Payments</option>
                                    <option value="CASH">Cash</option>
                                    <option value="MOBILE_MONEY">Momo</option>
                                    <option value="CARD">Card</option>
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Reference</th>
                                <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Details</th>
                                <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Stamp</th>
                                <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Volume</th>
                                <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Financials</th>
                                <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status</th>
                                <th className="py-6 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => handleViewDetails(order)}
                                    className="hover:bg-slate-50/50 transition-all group cursor-pointer"
                                >
                                    <td className="py-6 px-8">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-black text-slate-400 mb-1">#{order.id.split('-')[0]}</span>
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit uppercase tracking-tighter">TRX-{order.id.split('-').slice(0, 2).join('')}</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-200 group-hover:bg-blue-600 transition-colors">
                                                {order.items[0]?.name.charAt(0) || 'W'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Walk-in Transaction</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Terminal Sales</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-black text-slate-700">{new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 text-center text-sm font-black text-slate-600">
                                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-[10px]">
                                            <Package className="w-3 h-3" />
                                            {order.items.length} Units
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex flex-col">
                                            <p className="font-black text-slate-900 text-base tracking-tighter">UGX {(order.total || 0).toLocaleString()}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(order.paymentMethod || 'cash')}</span>
                                                {(order.discount || 0) > 0 && (
                                                    <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded uppercase tracking-widest italic">
                                                        -UGX {(order.discount || 0).toLocaleString()} Off
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all",
                                            order.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                order.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-red-50 text-red-600 border-red-100"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", order.status === 'COMPLETED' ? "bg-emerald-500" : order.status === 'PENDING' ? "bg-amber-500" : "bg-red-500")} />
                                            {order.status || 'COMPLETED'}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}
                                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group/btn"
                                        >
                                            <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="py-32 text-center bg-slate-50/30">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                                <Search className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No matching transactions</h3>
                                            <button
                                                onClick={() => { setSearchQuery(''); setStatusFilter('All'); setPaymentFilter('All'); }}
                                                className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Invoice Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Order Invoice" className="max-w-3xl">
                {selectedOrder && (
                    <div className="bg-white rounded-xl overflow-hidden">
                        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <FileText className="w-64 h-64" />
                            </div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-slate-400 font-medium uppercase tracking-widest text-xs mb-2">Invoice To</p>
                                    <h2 className="text-2xl font-bold">Walk-in Customer</h2>
                                    <p className="text-slate-400 mt-1">Guest Account</p>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-3xl font-mono font-bold">{selectedOrder.id.split('-').slice(0, 2).join('-')}</h1>
                                    <p className="text-emerald-400 font-bold mt-1 flex items-center justify-end gap-1">
                                        <CheckCircle className="w-4 h-4" /> Paid Successfully
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8 flex gap-8">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Date Issued</p>
                                    <p className="font-mono mt-1">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Payment Method</p>
                                    <p className="capitalize mt-1">{(selectedOrder.paymentMethod || 'cash').replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Item Description</th>
                                        <th className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest w-24">Qty</th>
                                        <th className="py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest w-32">Price</th>
                                        <th className="py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest w-32">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {selectedOrder.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-4 text-slate-700 font-medium">
                                                {item.name}
                                                {item.discountAmount > 0 && (
                                                    <p className="text-[10px] text-emerald-600 font-bold">- UGX {item.discountAmount.toLocaleString()} discount</p>
                                                )}
                                            </td>
                                            <td className="py-4 text-center text-slate-500">{item.qty}</td>
                                            <td className="py-4 text-right text-slate-500">{(item.price || 0).toLocaleString()}</td>
                                            <td className="py-4 text-right font-bold text-slate-900">{(item.qty * (item.price || 0) - (item.discountAmount || 0)).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end mt-8">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>UGX {(selectedOrder.total || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Tax (0%)</span>
                                        <span>UGX 0</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Discount</span>
                                        <span>- UGX {(selectedOrder.discount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                                        <span className="font-bold text-slate-900">Total</span>
                                        <span className="font-bold text-xl text-blue-600">UGX {(selectedOrder.total || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
                            <button
                                onClick={() => handleInitiateReturn(selectedOrder)}
                                disabled={selectedOrder.status === 'CANCELLED'}
                                className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className="w-4 h-4" /> Refund Order
                            </button>
                            <div className="flex gap-3">
                                <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                    Print Info
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Return Initiation Modal */}
            <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Initiate Return / Refund" className="max-w-2xl">
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm flex gap-3">
                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>Select the items and quantities the customer is returning. Returned items will be added back to inventory stock.</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Items in Order</h4>
                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left font-bold text-slate-500">Product</th>
                                            <th className="py-3 px-4 text-center font-bold text-slate-500">Purchased</th>
                                            <th className="py-3 px-4 text-right font-bold text-slate-500 w-32">Return Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {selectedOrder.items.map((item) => {
                                            const returnData = returningItems.find(ri => ri.orderItemId === item.id);
                                            return (
                                                <tr key={item.id}>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-800">{item.name}</div>
                                                        <div className="text-xs text-slate-400">UGX {item.price.toLocaleString()}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-600 font-bold">{item.qty}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleReturnQuantityChange(item.id, Math.max(0, (returnData?.quantity || 0) - 1))}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-8 text-center font-black text-slate-900">{returnData?.quantity || 0}</span>
                                                            <button
                                                                onClick={() => handleReturnQuantityChange(item.id, Math.min(item.qty, (returnData?.quantity || 0) + 1))}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Reason for Return</label>
                            <textarea
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                placeholder="Defective item, customer changed mind, wrong size, etc."
                                className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button onClick={() => setIsReturnModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                            <button
                                onClick={submitReturn}
                                disabled={isSubmittingReturn}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmittingReturn ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</> : 'Complete Return'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Export Format Modal */}
            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Intelligence Export">
                <div className="space-y-6 pt-2 text-center">
                    <p className="text-sm text-slate-500 font-medium italic">Select your preferred format for the transaction ledger.</p>
                    <div className="grid grid-cols-3 gap-4">
                        {['CSV', 'EXCEL', 'PDF'].map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => handleExport(fmt)}
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
        </div>
    );
}
