'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function serializeShift(shift: any) {
    if (!shift) return null;
    return {
        ...shift,
        initialAmount: Number(shift.initialAmount),
        finalAmount: shift.finalAmount !== null ? Number(shift.finalAmount) : null,
        systemAmount: shift.systemAmount !== null ? Number(shift.systemAmount) : null,
        difference: shift.difference !== null ? Number(shift.difference) : null,
    };
}

// Get all cash registers for selection
export async function getCashRegisters() {
    return await prisma.cashRegister.findMany();
}

// Get Open Shift for a user
export async function getOpenShift(userId: number) {
    const shift = await prisma.shift.findFirst({
        where: {
            userId: userId,
            status: 'ABIERTA'
        },
        include: {
            cashRegister: true
        }
    });
    return serializeShift(shift);
}

// Open Shift
export async function openShift(userId: number, cashRegisterId: number, initialAmount: number) {
    try {
        // 1. Check if user already has open shift
        const existing = await getOpenShift(userId);
        if (existing) {
            return { success: false, error: 'Ya tienes un turno abierto en caja ' + existing.cashRegister.name };
        }

        // 2. Create Shift
        const shift = await prisma.shift.create({
            data: {
                userId,
                cashRegisterId,
                initialAmount,
                startTime: new Date(),
                status: 'ABIERTA'
            }
        });

        // Update Register Status
        await prisma.cashRegister.update({
            where: { id: cashRegisterId },
            data: { status: 'ABIERTA' }
        });

        revalidatePath('/pos');
        return { success: true, data: serializeShift(shift) };

    } catch (error: any) {
        console.error('Error opening shift:', error);
        return { success: false, error: 'Error al abrir caja' };
    }
}

// Close Shift
export async function closeShift(userId: number, finalAmount: number) {
    try {
        const shift = await getOpenShift(userId);
        if (!shift) {
            return { success: false, error: 'No tienes una caja abierta para cerrar.' };
        }

        const sales = await prisma.sale.findMany({
            where: { shiftId: shift.id, status: 'COMPLETADA' }
        });

        const movements = await prisma.cashMovement.findMany({
            where: { shiftId: shift.id }
        });

        // Sum Sales (Total)
        const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);

        // Sum Sales (Cash only)
        const cashSales = sales
            .filter(s => s.paymentMethod === 'EFECTIVO' || s.paymentMethod === 'MIXTO')
            .reduce((sum, s) => sum + Number(s.total), 0);

        // Movements
        const income = movements.filter(m => m.type === 'INGRESO').reduce((sum, m) => sum + Number(m.amount), 0);
        const expense = movements.filter(m => m.type === 'EGRESO').reduce((sum, m) => sum + Number(m.amount), 0);

        const systemAmount = Number(shift.initialAmount) + cashSales + income - expense;
        const difference = finalAmount - systemAmount;

        // Update Shift
        await prisma.shift.update({
            where: { id: shift.id },
            data: {
                endTime: new Date(),
                status: 'CERRADA',
                finalAmount,
                systemAmount,
                difference
            }
        });

        // Close Register
        await prisma.cashRegister.update({
            where: { id: shift.cashRegisterId },
            data: { status: 'CERRADA' }
        });

        revalidatePath('/pos');
        return { success: true };

    } catch (error: any) {
        console.error('Error closing shift:', error);
        return { success: false, error: 'Error al cerrar caja' };
    }
}

// Register Movement
export async function registerMovement(userId: number, type: 'INGRESO' | 'EGRESO', amount: number, description: string) {
    try {
        const shift = await getOpenShift(userId);
        if (!shift) return { success: false, error: 'No hay turno abierto' };

        await prisma.cashMovement.create({
            data: {
                userId,
                shiftId: shift.id,
                type,
                amount,
                description,
                date: new Date()
            }
        });

        return { success: true };
    } catch (e) {
        return { success: false, error: 'Error al registrar movimiento' };
    }
}

// Get Shift Details (for Close Preview)
export async function getShiftDetails(userId: number) {
    const shift = await getOpenShift(userId);
    if (!shift) return null;

    const sales = await prisma.sale.findMany({
        where: { shiftId: shift.id, status: 'COMPLETADA' }
    });

    const movements = await prisma.cashMovement.findMany({
        where: { shiftId: shift.id }
    });

    // Group sales by method
    const salesByMethod: Record<string, number> = {};
    sales.forEach(s => {
        salesByMethod[s.paymentMethod] = (salesByMethod[s.paymentMethod] || 0) + Number(s.total);
    });

    const totalSales = sales.reduce((s, x) => s + Number(x.total), 0);
    const income = movements.filter(m => m.type === 'INGRESO').reduce((sum, m) => sum + Number(m.amount), 0);
    const expense = movements.filter(m => m.type === 'EGRESO').reduce((sum, m) => sum + Number(m.amount), 0);

    // Estimated Cash in Drawer
    // Initial + Cash Sales + Incomes - Expenses
    const cashSales = salesByMethod['EFECTIVO'] || 0;
    const estimatedCash = Number(shift.initialAmount) + cashSales + income - expense;

    return {
        shift: serializeShift(shift),
        totalSales,
        salesByMethod,
        income,
        expense,
        estimatedCash,
        movements: movements.map(m => ({
            ...m,
            amount: Number(m.amount)
        }))
    };
}
