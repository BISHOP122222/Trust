import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
    FunnelChart, Funnel
} from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Power BI Inspired Color Palette
const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5'];

interface ChartProps {
    data: any[];
    title?: string;
    height?: number;
}

export const PowerBIKPICard = ({ title, value, trend, trendValue, icon: Icon, colorClass }: any) => {
    const isPositive = trend === 'up';
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
            <div className={cn("absolute top-0 left-0 w-1 h-full", colorClass || "bg-blue-600")} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
                    </div>
                    {Icon && (
                        <div className={cn("p-3 rounded-2xl", colorClass ? `bg-${colorClass?.split('-')[1]}-50 text-${colorClass?.split('-')[1]}-600` : "bg-blue-50 text-blue-600")}>
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trendValue}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">vs last period</span>
                </div>
            </CardContent>
        </Card>
    );
};

export const PowerBIColumnChart = ({ data, title, height = 300 }: ChartProps) => (
    <div className="space-y-4">
        {title && <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>}
        <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="columnGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Bar dataKey="value" fill="url(#columnGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const PowerBIPieChart = ({ data, title, height = 300 }: ChartProps) => (
    <div className="space-y-4">
        {title && <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>}
        <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const PowerBIAreaChart = ({ data, title, height = 300 }: ChartProps) => (
    <div className="space-y-4">
        {title && <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>}
        <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        name="Revenue"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#areaGradient)"
                    />
                    <Area
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#16a34a"
                        strokeWidth={3}
                        fillOpacity={0.1}
                        fill="#16a34a"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const PowerBIFunnelChart = ({ data, title, height = 300 }: ChartProps) => (
    <div className="space-y-4">
        {title && <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>}
        <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Funnel
                        dataKey="value"
                        data={data}
                        isAnimationActive
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const TopProductsTable = ({ data, title }: { data: any[], title?: string }) => (
    <div className="space-y-4">
        {title && <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>}
        <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                                <span className="text-xs font-bold text-slate-700 uppercase">{item.name}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <span className="text-xs font-black text-slate-900">{item.quantity}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <span className="text-[10px] font-black text-blue-600 uppercase">UGX {(item.revenue || 0).toLocaleString()}</span>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-4 py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No activity data</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);
export const PowerBIStackedBarChart = ({ data, title, height = 300 }: ChartProps) => (
    <div className="space-y-4">
        {title && <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>}
        <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{value}</span>}
                    />
                    <Bar dataKey="quantity" name="Units Sold" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="stock" name="Current Stock" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);
