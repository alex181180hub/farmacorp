'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getAllCashiers() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true }
    });
    return users;
}

export async function getCurrentUserSession() {
    const session = await getSession();
    if (!session || !session.user) return null;

    // Ensure we have the role. The session might not have it if it's old, 
    // strictly we should fetch from DB to be sure or trust the token.
    // For now trust the token if it has role, otherwise default/fetch.
    // Assuming session.user has role. If not, we might need to fetch.
    return {
        id: parseInt(session.user.id),
        name: session.user.name,
        username: session.user.username,
        role: session.user.role // 'Admin', etc.
    };
}


// Helper to parse local date string YYYY-MM-DD to Date at 00:00:00
function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export async function getDailyReport(from?: string, to?: string, userId?: string) {
    const session = await getSession();
    if (!session) return { success: false, error: 'No autorizado' };

    let start: Date;
    if (from) {
        start = parseLocalDate(from);
    } else {
        start = new Date();
        start.setHours(0, 0, 0, 0);
    }

    let end: Date;
    if (to) {
        end = parseLocalDate(to);
        end.setHours(23, 59, 59, 999);
    } else {
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
    }

    try {
        const whereClause: any = {
            startTime: {
                gte: start,
                lte: end
            }
        };

        if (userId && userId !== 'all') {
            whereClause.userId = parseInt(userId);
        }

        // Fetch Shifts with all details
        const shifts = await prisma.shift.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true } },
                cashRegister: { select: { name: true } },
                sales: { where: { status: 'COMPLETADA' } },
                movements: true
            },
            orderBy: { startTime: 'desc' }
        });

        // Process each shift
        const shiftSummaries = shifts.map(shift => {
            const totalSales = shift.sales.reduce((sum, s) => sum + Number(s.total), 0);

            const income = shift.movements.filter(m => m.type === 'INGRESO').reduce((sum, m) => sum + Number(m.amount), 0);
            const expense = shift.movements.filter(m => m.type === 'EGRESO').reduce((sum, m) => sum + Number(m.amount), 0);

            // Methods breakdown per shift
            const methods: Record<string, number> = {};
            shift.sales.forEach(s => {
                methods[s.paymentMethod] = (methods[s.paymentMethod] || 0) + Number(s.total);
            });

            return {
                id: shift.id,
                user: shift.user.name,
                register: shift.cashRegister.name,
                start: shift.startTime,
                end: shift.endTime,
                status: shift.status,
                initialAmount: Number(shift.initialAmount),
                finalAmount: shift.finalAmount ? Number(shift.finalAmount) : 0,
                difference: shift.difference ? Number(shift.difference) : 0,
                totalSales,
                income,
                expense,
                methods,
                movements: shift.movements.map(m => ({
                    ...m,
                    amount: Number(m.amount)
                }))
            };
        });

        // Grand Totals
        const grandTotal = {
            sales: shiftSummaries.reduce((sum, s) => sum + s.totalSales, 0),
            income: shiftSummaries.reduce((sum, s) => sum + s.income, 0),
            expense: shiftSummaries.reduce((sum, s) => sum + s.expense, 0),
            difference: shiftSummaries.reduce((sum, s) => sum + s.difference, 0)
        };

        return {
            success: true,
            data: {
                period: to ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : start.toLocaleDateString(),
                grandTotal,
                shifts: shiftSummaries
            }
        };

    } catch (e) {
        console.error(e);
        return { success: false, error: 'Error al generar reporte' };
    }
}

export async function getSalesBook(from?: string, to?: string) {
    const session = await getSession();
    if (!session) return { success: false, error: 'No autorizado' };

    // Range Logic
    let start: Date;
    let end: Date;

    const now = new Date();

    if (from) {
        start = parseLocalDate(from);
    } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (to) {
        end = parseLocalDate(to);
        end.setHours(23, 59, 59, 999);
    } else {
        // If no 'to' provided, defaults to end of current month if 'from' wasn't provided, 
        // OR end of 'start' day? The original logic was convoluted. 
        // Let's standard: if no 'to', go to end of the month of 'start'.
        // Actually, let's keep it simple: end of current month if (from/to) not spec, else end of day 'start' if only 'start' spec?
        // Original: "Default end is end of current month, or end of provided 'to' day"
        // Let's stick to: if 'to' provided -> end of 'to'. Else -> end of current local month.
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    try {
        const sales = await prisma.sale.findMany({
            where: {
                date: { gte: start, lte: end },
                status: 'COMPLETADA',
                invoiceNumber: { not: null }
            },
            include: { customer: true },
            orderBy: { date: 'asc' }
        });

        return {
            success: true,
            data: sales.map(s => ({
                date: s.date.toISOString().split('T')[0],
                invoiceNumber: s.invoiceNumber,
                authorization: s.cuf?.substring(0, 15) + '...',
                nit: s.customer?.nit || '0',
                name: s.customer?.razonSocial || 'S/N',
                amount: Number(s.total),
                ice: 0,
                exluded: 0,
                base: Number(s.total),
                fiscalDebit: Number(s.total) * 0.13
            }))
        };
    } catch (e) {
        return { success: false, error: 'Error al obtener Libro de Ventas' };
    }
}

export async function getCriticalStock() {
    const session = await getSession();
    if (!session) return { success: false, error: 'No autorizado' };

    try {
        const products = await prisma.product.findMany({
            where: {
                stock: { lt: 100 } // Heuristic optimization
            },
            include: { category: true }
        });

        const critical = products.filter(p => p.stock <= p.minStock);

        return { success: true, data: critical };
    } catch (e) {
        return { success: false, error: 'Error al obtener Stock Crítico' };
    }
}

export async function getTopProducts(from?: string, to?: string) {
    const session = await getSession();
    if (!session) return { success: false, error: 'No autorizado' };

    let start: Date | undefined;
    let end: Date | undefined;

    if (from) start = parseLocalDate(from);
    if (to) {
        end = parseLocalDate(to);
        end.setHours(23, 59, 59, 999);
    }

    try {
        const whereClause: any = {
            sale: {
                status: 'COMPLETADA'
            }
        };

        if (start || end) {
            whereClause.sale.date = {};
            if (start) whereClause.sale.date.gte = start;
            if (end) whereClause.sale.date.lte = end;
        }

        const top = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: whereClause,
            orderBy: { _sum: { quantity: 'desc' } },
            take: 10
        });

        const details = await Promise.all(top.map(async (t) => {
            const p = await prisma.product.findUnique({ where: { id: t.productId } });
            return {
                name: p?.name || 'Desconocido',
                code: p?.code,
                quantity: t._sum.quantity
            };
        }));

        return { success: true, data: details };

    } catch (e) {
        return { success: false, error: 'Error al obtener Ranking' };
    }
}
