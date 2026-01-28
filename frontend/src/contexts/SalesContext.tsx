import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { useNotifications } from './NotificationContext';

export interface SaleItem {
    id: string;
    name: string;
    qty: number;
    price: number;
    discountAmount: number;
}

export interface Sale {
    id: string;
    items: SaleItem[];
    total: number;
    totalAmount?: number;
    date: string;
    createdAt?: string;
    paymentMethod: string;
    discount?: number;
    discountAmount?: number;
    taxAmount?: number;
    status: string;
}

export interface SalesContextType {
    sales: Sale[];
    addSale: (sale: any) => Promise<any>;
    recentSales: Sale[];
    totalRevenueToday: number;
    totalOrdersToday: number;
    loading: boolean;
    getStats: (period: string) => any;
    refreshStats: (period?: string) => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
    const [sales, setSales] = useState<Sale[]>([]);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotifications();

    const refreshStats = async (period: string = 'Today') => {
        try {
            setLoading(true);
            const response = await api.get(`/dashboard/stats?period=${period}`);
            setDashboardData(response.data);

            if (response?.data?.stats?.lowStockProducts > 0) {
                addNotification({
                    title: 'Low Stock Alert',
                    message: `There are ${response.data.stats.lowStockProducts} items currently low on stock.`,
                    type: 'warning',
                    link: '/inventory'
                });
            }

            const mappedSales = (response.data.recentOrders || []).map((order: any) => ({
                ...order,
                total: order.totalAmount || 0,
                paymentMethod: order.payment?.method || 'CASH',
                date: order.createdAt,
                items: (order.items || []).map((item: any) => ({
                    ...item,
                    qty: item.quantity || 0,
                    name: item.product?.name || 'Unknown Item',
                    discountAmount: item.discountAmount || 0
                }))
            }));

            setSales(mappedSales);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            refreshStats();
        } else {
            setLoading(false);
        }
    }, []);

    const addSale = async (saleData: any) => {
        try {
            let method = 'CASH';
            const inputMethod = (saleData.paymentMethod || '').toUpperCase();

            if (inputMethod === 'MOBILE_MONEY' || inputMethod === 'MOMO') method = 'MOBILE_MONEY';
            else if (inputMethod === 'CARD') method = 'CARD';
            else method = 'CASH';

            const payload = {
                items: saleData.items.map((item: any) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    serialItemId: item.serialItemId || undefined,
                    serialNumber: item.serialNumber || undefined,
                    discountAmount: item.discountAmount || 0
                })),
                paymentMethod: method,
                discountAmount: saleData.discount || 0,
                discountId: saleData.discountId || undefined,
                couponCode: saleData.couponCode || undefined,
                customerId: saleData.customerId || undefined
            };

            const response = await api.post('/orders', payload);

            addNotification({
                title: 'New Sale Completed',
                message: `Order ${response.data.orderNumber} for UGX ${payload.discountAmount > 0 ? (saleData.total || 0).toLocaleString() : (saleData.subtotal || 0).toLocaleString()} was successful.`,
                type: 'success',
                link: '/orders'
            });

            await refreshStats();
            return response.data;
        } catch (error: any) {
            console.error('Failed to create order:', JSON.stringify(error.response?.data || error.message));
            throw error;
        }
    };

    const recentSales = sales.slice(0, 10);

    const totalRevenueToday = dashboardData?.stats?.todayRevenue || 0;
    const totalOrdersToday = dashboardData?.stats?.totalOrders || 0;

    const getStats = (_period: string) => {
        if (!dashboardData) return {
            revenue: 0,
            orders: 0,
            bestCategory: 'N/A',
            revenueTrend: [],
            categoryDistribution: [],
            inventoryValue: 0,
            lowStockProducts: 0,
            totalProfit: 0,
            grossMargin: 0,
            avgOrderValue: 0,
            growth: { revenue: 0, orders: 0, profit: 0 }
        };

        const { stats, dailyLedger } = dashboardData;

        const revenueTrend = (dailyLedger.hourlyTrends || []).map((t: any) => ({
            name: t.name || t.hour || t.date,
            revenue: t.revenue,
            profit: t.profit
        }));

        const revenue = stats.todayRevenue;
        const totalProfit = stats.totalProfit;
        const orders = stats.totalOrders;
        const avgOrderValue = orders > 0 ? revenue / orders : 0;
        const grossMargin = revenue > 0 ? (totalProfit / revenue) * 100 : 0;

        return {
            revenue,
            orders,
            bestCategory: dailyLedger.categorySales[0]?.name || 'N/A',
            revenueTrend,
            categoryDistribution: dailyLedger.categorySales,
            inventoryValue: stats.inventoryValue,
            topItems: dailyLedger.topItems,
            lowStockProducts: stats.lowStockProducts || 0,
            totalProfit,
            grossMargin,
            avgOrderValue,
            growth: stats.growth || {
                revenue: 0,
                orders: 0,
                profit: 0
            }
        };
    };

    return (
        <SalesContext.Provider value={{
            sales,
            addSale,
            recentSales,
            totalRevenueToday,
            totalOrdersToday,
            loading,
            getStats,
            refreshStats
        }}>
            {children}
        </SalesContext.Provider>
    );
}

export const useSales = () => {
    const context = useContext(SalesContext);
    if (!context) throw new Error('useSales must be used within a SalesProvider');
    return context;
};
