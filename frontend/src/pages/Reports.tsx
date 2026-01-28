import { useState, useMemo, useEffect } from 'react';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useSales } from '@/contexts/SalesContext';
import { useToast } from '@/contexts/ToastContext';
import {
    PowerBIKPICard,
    PowerBIAreaChart,
    PowerBIPieChart,
    PowerBIStackedBarChart
} from '@/components/analytics/PowerBICharts';
import Modal from '@/components/ui/Modal';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/ExportUtils';
import { cn } from '@/lib/utils';

export default function Reports() {
    const { getStats, sales, refreshStats } = useSales();
    const { showToast } = useToast();
    const [dateRange, setDateRange] = useState('This Week');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => {
        refreshStats(dateRange);
    }, [dateRange]);

    const stats = useMemo(() => {
        const rawStats = getStats(dateRange);
        // Map revenueTrend to use 'value' key for PowerBIAreaChart
        return {
            ...rawStats,
            mappedRevenueTrend: rawStats.revenueTrend.map((t: any) => ({
                name: t.name,
                value: t.revenue,
                profit: t.profit || Math.round(t.revenue * 0.25)
            }))
        };
    }, [dateRange, getStats]);

    const handleExport = (format: string) => {
        if (sales.length === 0) {
            showToast('No transaction data to export', 'info');
            return;
        }

        const headers = ['Order ID', 'Date', 'Customer', 'Items Count', 'Payment Method', 'Total Amount', 'Status'];
        const rows = sales.map(s => [
            s.id,
            new Date(s.date).toLocaleString(),
            'Walk-in Customer',
            s.items.length,
            s.paymentMethod,
            s.total,
            s.status || 'COMPLETED'
        ]);

        const fileName = `financial_report_${dateRange.replace(' ', '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
        const title = `TRUST Financial Intelligence Report - ${dateRange}`;

        if (format === 'CSV') {
            exportToCSV(rows, fileName, headers);
            showToast('Financial report exported (CSV)', 'success');
        } else if (format === 'EXCEL') {
            exportToExcel(rows, fileName, headers);
            showToast('Financial report exported (Excel)', 'success');
        } else if (format === 'PDF') {
            exportToPDF(rows, fileName, headers, title);
            showToast('Financial report exported (PDF)', 'success');
        }
        setIsExportModalOpen(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Intelligence</h1>
                    <p className="text-slate-500 font-medium">Deep dive into business health and profitability</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none z-10" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="pl-11 pr-10 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:border-blue-400 shadow-sm font-black text-xs uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                        >
                            <option>Today</option>
                            <option>This Week</option>
                            <option>This Month</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                </div>
            </div>

            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PowerBIKPICard
                    title="Gross Revenue"
                    value={`UGX ${stats.revenue.toLocaleString()} `}
                    trend="up"
                    trendValue="15.2%"
                    icon={DollarSign}
                    colorClass="bg-blue-600"
                />
                <PowerBIKPICard
                    title="Net Profit"
                    value={`UGX ${Math.round(stats.totalProfit).toLocaleString()} `}
                    trend="up"
                    trendValue={`${stats.grossMargin.toFixed(1)}% `}
                    icon={TrendingUp}
                    colorClass="bg-emerald-600"
                />
                <PowerBIKPICard
                    title="Avg Transaction"
                    value={`UGX ${Math.round(stats.avgOrderValue).toLocaleString()} `}
                    trend="up"
                    trendValue="5.4%"
                    icon={ShoppingBag}
                    colorClass="bg-purple-600"
                />
            </div>

            {/* Performance Analysis & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                {/* Detailed Trend */}
                <Card className="lg:col-span-4 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                        <PowerBIAreaChart
                            data={stats.mappedRevenueTrend}
                            title={`Revenue vs Profit intelligence (${dateRange})`}
                            height={350}
                        />
                    </CardContent>
                </Card>

                {/* Categories Breakdown */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 h-full flex flex-col justify-center">
                        <PowerBIPieChart
                            data={stats.categoryDistribution}
                            title="Category Market Share"
                            height={250}
                        />
                    </CardContent>
                </Card>

                {/* Inventory Efficiency */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                        <PowerBIStackedBarChart
                            data={stats.topItems}
                            title="Inventory vs Sales Efficiency"
                            height={300}
                        />
                    </CardContent>
                </Card>

                {/* Growth Analysis */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Growth Index</h4>
                                <h3 className="text-2xl font-black tracking-tight">Predictive Analytics</h3>
                            </div>
                            <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                                Beta
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Customer Acquisition', value: '12.5%', trend: '+2.1%' },
                                { label: 'Revenue Velocity', value: 'UGX 1.2M/day', trend: '+15.4%' },
                                { label: 'Retention Protocol', value: '88%', trend: '+4.2%' },
                                { label: 'Operational Overhead', value: '18%', trend: '-2.1%', invert: true }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-lg font-black">{item.value}</p>
                                    </div>
                                    <div className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        item.invert ? "text-emerald-400" : "text-emerald-400"
                                    )}>
                                        {item.trend}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Professional Transaction Ledger */}
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-8 border-b border-slate-50">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Transaction Ledger</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Granular sale history and audit trail</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settled Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sales.slice(0, 15).map((sale) => (
                                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                        <td className="px-8 py-5">
                                            <span className="font-black text-slate-800 text-xs tracking-widest uppercase">TXN-{sale.id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{new Date(sale.date).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(sale.date).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-[10px] border border-blue-100">
                                                    {sale.items.length}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Products</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1.5 bg-slate-100 text-slate-900 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-300 shadow-sm">
                                                {sale.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-slate-900 tracking-tighter text-base">UGX {sale.total.toLocaleString()}</span>
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500"></div> Success
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sales.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-50" />
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No transaction records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Export Format Modal */}
            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Analytical Intelligence Export">
                <div className="space-y-6 pt-2 text-center">
                    <p className="text-sm text-slate-500 font-medium italic">Select your preferred format for the financial intelligence report.</p>
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
