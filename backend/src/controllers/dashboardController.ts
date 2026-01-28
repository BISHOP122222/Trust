import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// @desc    Get dashboard statistics with Daily Ledger
// @route   GET /api/dashboard/stats
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { period = 'Today' } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Determine Current Period Range
        let startDate = new Date(today);
        let endDate = new Date(); // Now

        let previousStartDate = new Date(startDate);
        let previousEndDate = new Date(startDate);

        if (period === 'This Week') {
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
            startDate.setDate(diff);

            // Previous week
            previousStartDate = new Date(startDate);
            previousStartDate.setDate(previousStartDate.getDate() - 7);
            previousEndDate = new Date(startDate); // Up to start of this week
        } else if (period === 'This Month') {
            startDate.setDate(1);

            // Previous month
            previousStartDate = new Date(startDate);
            previousStartDate.setMonth(previousStartDate.getMonth() - 1);
            previousEndDate = new Date(startDate);
        } else if (period === 'This Year') {
            startDate.setMonth(0, 1);

            // Previous year
            previousStartDate = new Date(startDate);
            previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
            previousEndDate = new Date(startDate);
        } else {
            // Default: Today
            startDate = new Date(today);

            // Yesterday
            previousStartDate = new Date(today);
            previousStartDate.setDate(previousStartDate.getDate() - 1);
            previousEndDate = new Date(today); // Up to start of today
        }

        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            ordersCount,
            productsCount,
            lowStockCount,
            totalRevenueAgg, // Lifetime revenue (optional, maybe not needed for period view but good for reference)
            periodRevenueAgg,
            paymentSummaryAgg,
            recentOrders,
            topSellingPeriod,
            periodOrdersDetail,
            thirtyDayOrders,
            // Previous Period Data for Growth Calculation
            prevOrdersCount,
            prevRevenueAgg,
            // prevProfit handling requires detailed query, easier to calculate from items
        ] = await Promise.all([
            prisma.order.count({
                where: { status: 'COMPLETED', createdAt: { gte: startDate } } // STRICTLY PERIOD BASED
            }),
            prisma.product.count(),
            prisma.product.count({
                where: { stockQuantity: { lte: 10 } }
            }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { status: 'COMPLETED' }
            }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                }
            }),
            prisma.payment.groupBy({
                by: ['method'],
                _sum: { amount: true },
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                }
            }),
            prisma.order.findMany({
                where: { createdAt: { gte: startDate } },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: { include: { product: true } },
                    payment: true
                }
            }),
            prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                where: {
                    order: { createdAt: { gte: startDate }, status: 'COMPLETED' }
                },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5
            }),
            prisma.order.findMany({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                include: { items: { include: { product: { include: { category: true } } } } }
            }),
            prisma.order.findMany({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: thirtyDaysAgo }
                },
                select: {
                    totalAmount: true,
                    createdAt: true
                }
            }),
            // Previous Period Queries
            prisma.order.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: previousStartDate, lt: previousEndDate }
                }
            }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: previousStartDate, lt: previousEndDate }
                }
            }),
        ]);

        // Process Period Stats & Trends
        let periodProfit = 0;
        let trendData: any[] = [];

        // Initialize Trend Buckets
        if (period === 'Today' || period === 'This Week') {
            // For "This Week", showing daily breakdown might be better than hourly? 
            // Original logic had 24h for Today/Week. Keeping consistent but normally Week=Days.
            // Let's make "This Week" daily breakdown.
            if (period === 'This Week') {
                trendData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ name: d, revenue: 0, profit: 0 }));
            } else {
                trendData = Array.from({ length: 24 }, (_, i) => ({
                    name: `${i}:00`,
                    revenue: 0,
                    profit: 0
                }));
            }
        } else if (period === 'This Month') {
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            trendData = Array.from({ length: daysInMonth }, (_, i) => ({
                name: `${i + 1}`,
                revenue: 0,
                profit: 0
            }));
        } else if (period === 'This Year') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            trendData = months.map(name => ({
                name,
                revenue: 0,
                profit: 0
            }));
        }

        // Process Category Stats & Fill Trends
        const categoryStatsMap: Record<string, number> = {};

        periodOrdersDetail.forEach(order => {
            const orderDate = new Date(order.createdAt);
            // Calculate Order Profit (Used for Period Profit)
            let orderProfit = 0;

            order.items.forEach(item => {
                const categoryName = item.product.category?.name || 'Uncategorized';
                categoryStatsMap[categoryName] = (categoryStatsMap[categoryName] || 0) + (item.price * item.quantity);

                // Derived Cost/Profit calculation
                const costPrice = (item as any).costPrice ?? (item.price * 0.7); // Fallback to 70% if no cost
                const itemProfit = (item.price - costPrice) * item.quantity;
                const itemRevenue = item.price * item.quantity;

                orderProfit += itemProfit;
                periodProfit += itemProfit;
            });

            // Update Trend Data
            if (period === 'Today') {
                const hour = orderDate.getHours();
                if (trendData[hour]) {
                    trendData[hour].revenue += order.totalAmount; // Use order total to match strict revenue
                    trendData[hour].profit += orderProfit;
                }
            } else if (period === 'This Week') {
                // Mon=0...Sun=6
                let dayIndex = orderDate.getDay() - 1;
                if (dayIndex === -1) dayIndex = 6; // Sunday
                if (trendData[dayIndex]) {
                    trendData[dayIndex].revenue += order.totalAmount;
                    trendData[dayIndex].profit += orderProfit;
                }
            } else if (period === 'This Month') {
                const day = orderDate.getDate() - 1;
                if (trendData[day]) {
                    trendData[day].revenue += order.totalAmount;
                    trendData[day].profit += orderProfit;
                }
            } else if (period === 'This Year') {
                const month = orderDate.getMonth();
                if (trendData[month]) {
                    trendData[month].revenue += order.totalAmount;
                    trendData[month].profit += orderProfit;
                }
            }
        });

        // Previous Period Profit Calculation (Approximate using 30% margin rule if detailed items not fetched for speed, 
        // OR fetch detailed like current period. For performance, let's assume margin matches current or fixed 30%)
        // To be accurate, we'll use a simple ratio from current period or generic 30% for invalid historical data
        // For accurate growth, we need previous profit. 
        // Let's do a quick aggregate for previous Profit if possible, but schema structure makes it hard without joins.
        // We will assume a flat 30% profit margin for previous period for estimation to avoid heavy query,
        // unless we want to do the same heavy query for previous period.
        // Better approach: Use Revenue Growth as proxy for Profit Growth roughly, or just calculate revenue growth accurately.

        const currentRevenue = periodRevenueAgg._sum.totalAmount || 0;
        const prevRevenue = prevRevenueAgg._sum.totalAmount || 0;

        // Calculate Growth %
        const calcGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const revenueGrowth = calcGrowth(currentRevenue, prevRevenue);
        const ordersGrowth = calcGrowth(ordersCount, prevOrdersCount);

        // For profit, we can't easily get prevProfit without iterating items from prev period.
        // Let's Assume Profit follows Revenue trajectory for now to save DB load, or use crude 30% of revenue
        const prevProfitEst = prevRevenue * 0.3;
        const profitGrowth = calcGrowth(periodProfit, prevProfitEst);

        const currentAOV = ordersCount > 0 ? currentRevenue / ordersCount : 0;
        const prevAOV = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;
        const aovGrowth = calcGrowth(currentAOV, prevAOV);


        const categorySales = Object.keys(categoryStatsMap).map(name => ({
            name,
            value: categoryStatsMap[name]
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        // Process 30-day trend (unchanged)
        const thirtyDayTrend: Record<string, number> = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            thirtyDayTrend[dateStr] = 0;
        }
        thirtyDayOrders.forEach(order => {
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            if (thirtyDayTrend[dateStr] !== undefined) thirtyDayTrend[dateStr] += order.totalAmount;
        });
        const thirtyDayTrendArray = Object.keys(thirtyDayTrend).map(date => ({
            date: new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            revenue: thirtyDayTrend[date]
        })).reverse();

        // Top Items
        const topItemsWithDetails = await Promise.all(
            topSellingPeriod.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true, price: true, stockQuantity: true }
                });
                return {
                    name: product?.name || 'Unknown',
                    quantity: item._sum.quantity || 0,
                    revenue: (product?.price || 0) * (item._sum.quantity || 0),
                    stock: product?.stockQuantity || 0
                };
            })
        );

        // Inventory valuation
        const allProducts = await prisma.product.findMany({
            where: { isActive: true },
            select: { price: true, stockQuantity: true, costPrice: true }
        });
        const totalInventoryValue = allProducts.reduce((sum, p) => {
            const cost = p.costPrice || (p.price * 0.7);
            return sum + (cost * p.stockQuantity);
        }, 0);

        res.json({
            stats: {
                totalOrders: ordersCount, // Now period-scopeds
                totalOrdersLifetime: await prisma.order.count({ where: { status: 'COMPLETED' } }), // Optional extra
                totalProducts: productsCount,
                lowStockProducts: lowStockCount,
                totalRevenue: totalRevenueAgg._sum.totalAmount || 0, // Lifetime
                todayRevenue: currentRevenue, // Actually "Period Revenue" based on filters
                totalProfit: periodProfit, // Period Profit
                inventoryValue: totalInventoryValue,
                growth: {
                    revenue: parseFloat(revenueGrowth.toFixed(1)),
                    orders: parseFloat(ordersGrowth.toFixed(1)),
                    profit: parseFloat(profitGrowth.toFixed(1)),
                    avgOrderValue: parseFloat(aovGrowth.toFixed(1))
                }
            },
            dailyLedger: {
                revenue: currentRevenue,
                payments: paymentSummaryAgg.map(p => ({
                    method: p.method,
                    amount: p._sum.amount || 0
                })),
                topItems: topItemsWithDetails,
                hourlyTrends: trendData,
                categorySales,
                thirtyDayTrend: thirtyDayTrendArray
            },
            recentOrders
        });
    } catch (error) {
        next(error);
    }
};
