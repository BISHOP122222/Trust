import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Types ---
export interface SalesDataPoint {
    name: string;
    sales: number;
    revenue: number;
}

export interface RadialDataPoint {
    name: string;
    uv: number;
    pv: number;
    fill: string;
}

// --- Components ---

/**
 * Premium Area Chart with Gradients
 */
export const SalesAreaChart = ({ data }: { data: SalesDataPoint[] }) => {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Premium Radial Bar Chart
 */
export const TargetRadialChart = ({ data }: { data: RadialDataPoint[] }) => {
    const style = {
        top: '50%',
        right: 0,
        transform: 'translate(0, -50%)',
        lineHeight: '24px',
    };

    return (
        <div className="w-full h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="100%" barSize={10} data={data}>
                    <RadialBar
                        background
                        dataKey="uv"
                    />
                    <Legend
                        iconSize={10}
                        layout="vertical"
                        verticalAlign="middle"
                        wrapperStyle={style as any}
                    />
                    <Tooltip />
                </RadialBarChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Glassmorphic Stat Card
 */
export const GlassStatCard = ({ title, value, trend, icon: Icon, color }: any) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative overflow-hidden rounded-[1.5rem] p-6 text-white shadow-xl",
                color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600",
                color === 'emerald' && "bg-gradient-to-br from-emerald-500 to-teal-600",
                color === 'orange' && "bg-gradient-to-br from-orange-400 to-red-500",
                color === 'purple' && "bg-gradient-to-br from-purple-500 to-pink-600",
                color === 'indigo' && "bg-gradient-to-br from-indigo-500 to-purple-600",
            )}
        >
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <Icon className="w-24 h-24 rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                </div>

                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider opacity-80 mb-1">{title}</h3>
                    <p className="text-2xl font-black tracking-tight">{value}</p>
                </div>

                {trend && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                        <span>{trend > 0 ? '+' : ''}{trend}%</span>
                        <span className="opacity-70">this week</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
