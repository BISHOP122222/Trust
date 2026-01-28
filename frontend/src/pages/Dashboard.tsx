import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Wallet, ArrowUpRight, Filter, Download, Clock, CheckCircle, Smartphone, CreditCard, Banknote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';
import { useSales, Sale } from '@/contexts/SalesContext';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { TopProductsTable, PowerBIPieChart } from '@/components/analytics/PowerBICharts';
import { SalesAreaChart, GlassStatCard } from '@/components/dashboard/PremiumCharts';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/ExportUtils';


export default function Dashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useUser();

    // State Management
    const [period, setPeriod] = useState('Today');
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [ledgerFilters, setLedgerFilters] = useState({
        paymentMethod: 'All',
        minAmount: '',
        maxAmount: ''
    });

    // Widget Configuration
    const [widgets, setWidgets] = useState([
        { id: 'kpi', label: 'Key Metrics', isVisible: true },
        { id: 'revenue', label: 'Revenue Trends', isVisible: true },
        { id: 'ledger', label: 'Live Ledger', isVisible: true },
        { id: 'yield', label: 'Market Yield', isVisible: true },
        { id: 'products', label: 'Top Products', isVisible: true },
    ]);

    const { recentSales, getStats, refreshStats } = useSales();

    useEffect(() => {
        refreshStats(period);
        // Load widget config from local storage if available
        const savedWidgets = localStorage.getItem('dashboardWidgets');
        if (savedWidgets) {
            setWidgets(JSON.parse(savedWidgets));
        }
    }, [period]);

    const handleWidgetUpdate = (newWidgets: any[]) => {
        setWidgets(newWidgets);
        localStorage.setItem('dashboardWidgets', JSON.stringify(newWidgets));
    };

    const isWidgetVisible = (id: string) => widgets.find(w => w.id === id)?.isVisible;

    const stats = useMemo(() => {
        const rawStats = getStats(period);
        return {
            ...rawStats,
            mappedRevenueTrend: rawStats.revenueTrend.map((t: any) => ({
                name: t.name,
                sales: t.revenue, // Mapping revenue to sales for area chart
                revenue: t.profit // using profit as second area
            })),
            mappedTopItems: (rawStats.topItems || []).map((t: any) => ({
                name: t.name,
                value: t.quantity,
                revenue: t.revenue
            }))
        };
    }, [period, getStats]);

    const filteredLedger = useMemo(() => {
        return recentSales.filter(sale => {
            const matchesMethod = ledgerFilters.paymentMethod === 'All' || sale.paymentMethod === ledgerFilters.paymentMethod;
            const matchesMin = !ledgerFilters.minAmount || sale.total >= Number(ledgerFilters.minAmount);
            const matchesMax = !ledgerFilters.maxAmount || sale.total <= Number(ledgerFilters.maxAmount);
            return matchesMethod && matchesMin && matchesMax;
        });
    }, [recentSales, ledgerFilters]);

    const handleExport = (format: string) => {
        const dataToExport = filteredLedger.length > 0 ? filteredLedger : recentSales;
        if (dataToExport.length === 0) {
            showToast('No sales data to export', 'info');
            return;
        }

        const headers = ['Order ID', 'Date', 'Items', 'Payment', 'Total'];
        const rows = dataToExport.map(s => [
            s.id,
            new Date(s.date).toLocaleString(),
            s.items.length,
            s.paymentMethod,
            s.total
        ]);

        const fileName = `sales_report_${new Date().toISOString().split('T')[0]}`;
        const title = `TrustPOS Sales Intelligence Report - ${period}`;

        if (format === 'CSV') {
            exportToCSV(rows, fileName, headers);
            showToast('Sales report exported (CSV)', 'success');
        } else if (format === 'EXCEL') {
            exportToExcel(rows, fileName, headers);
            showToast('Sales report exported (Excel)', 'success');
        } else if (format === 'PDF') {
            exportToPDF(rows, fileName, headers, title);
            showToast('Sales report exported (PDF)', 'success');
        }
        setIsExportModalOpen(false);
    };

    const handleFilter = () => {
        setIsFilterModalOpen(true);
    };

    // Role-Based Smart Logic
    const isAdmin = user?.role === 'Owner' || user?.role === 'Manager';

    const kpiMetrics = [
        { title: "Total Revenue", value: `UGX ${stats.revenue.toLocaleString()}`, trendValue: stats.growth.revenue, icon: Wallet, color: "blue", hidden: !isAdmin },
        { title: "Gross Profit", value: `UGX ${Math.round(stats.totalProfit).toLocaleString()}`, trendValue: stats.growth.profit, icon: TrendingUp, color: "emerald", hidden: user?.role !== 'Owner' },
        { title: "Total Orders", value: stats.orders.toLocaleString(), trendValue: stats.growth.orders, icon: ShoppingBag, color: "indigo" },
        { title: "Avg Order Value", value: `UGX ${Math.round(stats.avgOrderValue).toLocaleString()}`, trendValue: stats.growth.avgOrderValue, icon: ArrowUpRight, color: "purple", hidden: !isAdmin }
    ].filter(m => !m.hidden);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Header / Slicer Area */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                        Morning, {user?.name?.split(' ')[0] || 'Admin'}
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">Here is what's happening today.</p>
                </div>


            </div>

            {/* Slicer / Period Selector - Separate Row for clarity */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Executive Overview</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Real-time analytical performance</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <DashboardCustomizer widgets={widgets} onUpdate={handleWidgetUpdate} />
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {['Today', 'This Week', 'This Month', 'This Year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest whitespace-nowrap",
                                    period === p
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            {isWidgetVisible('kpi') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiMetrics.map((metric, index) => (
                        <GlassStatCard
                            key={index}
                            title={metric.title}
                            value={metric.value}
                            trend={metric.trendValue}
                            icon={metric.icon}
                            color={metric.color}
                        />
                    ))}
                </div>
            )}

            {/* Charts Row */}
            {/* Main Analytical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Primary Trend Chart */}
                {isWidgetVisible('revenue') && (
                    <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden bg-white">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Revenue & Profit Analytics</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Comparative Trend Analysis</p>
                                </div>
                            </div>
                            <SalesAreaChart data={stats.mappedRevenueTrend} />
                        </CardContent>
                    </Card>
                )}

                {/* Sales Ledger (Recent Activity) */}
                {isWidgetVisible('ledger') && (
                    <Card className="lg:col-span-1 lg:row-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2rem] bg-slate-900 text-white overflow-hidden flex flex-col h-[600px]">
                        <CardContent className="p-8 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        Live Ledger <Clock className="w-4 h-4 text-slate-500" />
                                    </h3>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">Real-time Stream</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleFilter} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-white transition-all shadow-sm"><Filter className="w-4 h-4" /></button>
                                    <button onClick={() => setIsExportModalOpen(true)} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"><Download className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {filteredLedger.length === 0 ? (
                                    <div className="text-center py-20 opacity-30">
                                        <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No matching activity</p>
                                    </div>
                                ) : (
                                    filteredLedger.slice(0, 15).map((sale) => (
                                        <div
                                            key={sale.id}
                                            onClick={() => { setSelectedOrder(sale); setIsModalOpen(true); }}
                                            className="relative group p-4 bg-slate-800/40 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer hover:shadow-lg hover:shadow-black/20"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center border",
                                                        sale.paymentMethod === 'MOBILE_MONEY' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                                            sale.paymentMethod === 'CARD' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                                                                "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                                    )}>
                                                        {sale.paymentMethod === 'MOBILE_MONEY' && <Smartphone className="w-3.5 h-3.5" />}
                                                        {sale.paymentMethod === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                                                        {sale.paymentMethod === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-white text-[10px] tracking-wider uppercase">TXN-{sale.id.slice(0, 6)}</h4>
                                                        <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                                                            {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.items.length} Items
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total</p>
                                                    <p className="text-sm font-black text-white tracking-tight">
                                                        {sale.total.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                onClick={() => navigate('/reports')}
                                className="w-full mt-6 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-slate-700 transition-all border border-slate-700/50 shadow-sm"
                            >
                                Full Transaction Ledger
                            </button>
                        </CardContent>
                    </Card>
                )}

                {/* Category Yield Pie Chart */}
                {isWidgetVisible('yield') && (
                    <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-white overflow-hidden h-[380px]">
                        <CardContent className="p-8">
                            <PowerBIPieChart
                                data={stats.categoryDistribution}
                                title="Category Market Yield"
                                height={280}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Product Performance Table */}
                {isWidgetVisible('products') && (
                    <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-white overflow-hidden h-[380px]">
                        <CardContent className="p-8">
                            <TopProductsTable
                                data={stats.mappedTopItems}
                                title="Top Performing Products"
                            />
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Quick View Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Quick Order View"
                className="max-w-2xl"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Transaction ID</h3>
                                <p className="text-xl font-black text-slate-900">TXN-{selectedOrder.id.slice(0, 12).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Status</h3>
                                <div className="mt-1 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Settled
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                            <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>Product details</span>
                                <span>Qty & Price</span>
                            </div>
                            <div className="space-y-3">
                                {selectedOrder.items.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 italic">Unit Price: UGX {item.price.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-slate-900">x{item.qty}</span>
                                            <p className="text-[10px] font-black text-blue-600">UGX {(item.qty * item.price).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Settlement</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">UGX {selectedOrder.total.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Ledger Filters Modal */}
            <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Audit Ledger Filters">
                <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                value={ledgerFilters.paymentMethod}
                                onChange={(e) => setLedgerFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            >
                                <option>All</option>
                                <option>CASH</option>
                                <option>MOBILE_MONEY</option>
                                <option>CARD</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Price (UGX)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    value={ledgerFilters.minAmount}
                                    onChange={(e) => setLedgerFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Price (UGX)</label>
                                <input
                                    type="number"
                                    placeholder="1,000,000"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    value={ledgerFilters.maxAmount}
                                    onChange={(e) => setLedgerFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => {
                                setLedgerFilters({ paymentMethod: 'All', minAmount: '', maxAmount: '' });
                                setIsFilterModalOpen(false);
                            }}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
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
