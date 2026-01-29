'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getDashboardStats() {
    const session = await getSession();
    if (!session) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const matchToday = {
        date: { gte: today },
        status: 'COMPLETADA'
    };

    const matchYesterday = {
        date: { gte: yesterday, lte: endOfYesterday },
        status: 'COMPLETADA'
    };

    try {
        // 1. Net Sales
        const salesToday = await prisma.sale.aggregate({
            _sum: { total: true },
            where: matchToday
        });

        const salesYesterday = await prisma.sale.aggregate({
            _sum: { total: true },
            where: matchYesterday
        });

        const totalToday = Number(salesToday._sum.total || 0);
        const totalYesterday = Number(salesYesterday._sum.total || 0);

        let salesGrowth = 0;
        if (totalYesterday > 0) {
            salesGrowth = ((totalToday - totalYesterday) / totalYesterday) * 100;
        } else if (totalToday > 0) {
            salesGrowth = 100;
        }

        // 2. Customers Served (Transactions count)
        const customersToday = await prisma.sale.count({
            where: matchToday
        });

        // 3. Kardex Movements (Sales Items + Purchase Items today)
        // Note: Ideally we would have a dedicated InventoryMovement table, but we sum items for now.
        const saleItemsCount = await prisma.saleItem.count({
            where: {
                sale: { date: { gte: today } }
            }
        });

        const purchaseItemsCount = await prisma.purchaseItem.count({
            where: {
                purchase: { date: { gte: today } }
            }
        });

        const totalMovements = saleItemsCount + purchaseItemsCount;

        // DEBUG: Check if sales exist
        const debugTotal = await prisma.sale.count();
        const debugCompleted = await prisma.sale.count({ where: { status: 'COMPLETADA' } });
        console.log('DEBUG DASHBOARD:', { debugTotal, debugCompleted, totalToday, salesToday: salesToday._sum.total });

        return {
            sales: {
                amount: totalToday,
                growth: salesGrowth,
                debugTotal,
                debugCompleted
            },
            customers: {
                count: customersToday,
                details: 'transacciones'
            },
            kardex: {
                count: totalMovements
            }
        };

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            sales: { amount: 0, growth: 0, debugTotal: -1, debugCompleted: -1 },
            customers: { count: 0, details: '' },
            kardex: { count: 0 }
        };
    }
}

export async function getDashboardChartData() {
    const today = new Date();
    const last7Days: Date[] = [];

    // Robust Helper to get YYYY-MM-DD in local time
    const getLocalYYYYMMDD = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() - offset);
        return localDate.toISOString().slice(0, 10);
    };

    // Generate last 7 days keys
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        // Ensure we are working with the start of the day
        d.setHours(0, 0, 0, 0);
        last7Days.push(d);
    }

    try {
        // Start date: 6 days ago at 00:00:00
        const start = new Date(last7Days[0]);
        start.setHours(0, 0, 0, 0);

        const sales = await prisma.sale.findMany({
            where: {
                date: { gte: start },
                status: 'COMPLETADA'
            },
            select: {
                date: true,
                total: true
            }
        });

        const salesByDay = new Map<string, number>();

        sales.forEach(s => {
            // Group using the same local logic
            const dateKey = getLocalYYYYMMDD(s.date);
            const amount = Number(s.total);
            salesByDay.set(dateKey, (salesByDay.get(dateKey) || 0) + amount);
        });

        const result = last7Days.map(day => {
            const dateKey = getLocalYYYYMMDD(day);
            return {
                label: day.toLocaleDateString('es-BO', { weekday: 'short' }),
                date: dateKey,
                value: salesByDay.get(dateKey) || 0
            };
        });

        return result;

    } catch (error) {
        console.error('Error fetching chart data:', error);
        return last7Days.map(day => ({
            label: day.toLocaleDateString('es-BO', { weekday: 'short' }),
            date: getLocalYYYYMMDD(day),
            value: 0
        }));
    }
}

export async function getDashboardTopProducts() {
    try {
        const top = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: {
                sale: { status: 'COMPLETADA' }
            },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        // Fetch details
        const details = await Promise.all(top.map(async (t) => {
            const product = await prisma.product.findUnique({
                where: { id: t.productId },
                select: { name: true, code: true, stock: true }
            });

            return {
                id: t.productId,
                name: product?.name || 'Desconocido',
                code: product?.code || '???',
                sold: t._sum.quantity || 0,
                currentStock: product?.stock || 0
            };
        }));

        return details;

    } catch (e) {
        return [];
    }
}
