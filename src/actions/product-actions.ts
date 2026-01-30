'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function getInventoryProducts(query: string = '') {
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { code: { contains: query } },
                { barcode: { contains: query } },
            ]
        },
        include: { category: true },
        orderBy: { name: 'asc' }
    });

    return products.map(p => ({
        ...p,
        price: p.price.toString(),
        cost: p.cost.toString(),
    }));
}

export async function getExpiringProducts() {
    try {
        const today = new Date();
        // 3 months threshold
        const threshold = new Date();
        threshold.setMonth(today.getMonth() + 3);

        // We count all products expiring before the threshold (including already expired ones) that have stock
        const count = await prisma.product.count({
            where: {
                expirationDate: {
                    lte: threshold
                },
                stock: {
                    gt: 0
                }
            }
        });

        return count;
    } catch {
        return 0;
    }
}

export async function getExpiringProductsList() {
    const today = new Date();
    const threshold = new Date();
    threshold.setMonth(today.getMonth() + 3);

    const products = await prisma.product.findMany({
        where: {
            expirationDate: {
                lte: threshold
            },
            stock: {
                gt: 0
            }
        },
        orderBy: { expirationDate: 'asc' },
        take: 50
    });

    // Calculate real expired quantity based on FIFO batches
    const productsWithBatches = await Promise.all(products.map(async (p) => {
        const purchases = await prisma.purchaseItem.findMany({
            where: { productId: p.id },
            orderBy: { purchase: { date: 'desc' } }, // Newest first
            select: { quantity: true, expirationDate: true }
        });

        let remainingStockToAccount = p.stock;
        let realExpiredStock = 0;

        // Iterate through purchases (newest to oldest) to identify which batches make up the current stock
        for (const batch of purchases) {
            if (remainingStockToAccount <= 0) break;

            const quantityFromBatch = Math.min(remainingStockToAccount, batch.quantity);
            remainingStockToAccount -= quantityFromBatch;

            if (batch.expirationDate) {
                const expDate = new Date(batch.expirationDate);
                // Check if this specific batch is expired
                if (expDate < today) {
                    realExpiredStock += quantityFromBatch;
                }
            } else {
                // If batch has no date, fallback to product date or ignore?
                // Usually we fallback to product.expirationDate if available
                if (p.expirationDate && new Date(p.expirationDate) < today) {
                    realExpiredStock += quantityFromBatch;
                }
            }
        }

        // If there is still stock not accounted for by purchase history (e.g. initial migration)
        // We evaluate it using the main product expiration date
        if (remainingStockToAccount > 0) {
            if (p.expirationDate && new Date(p.expirationDate) < today) {
                realExpiredStock += remainingStockToAccount;
            }
        }

        return {
            ...p,
            price: p.price.toString(),
            cost: p.cost.toString(),
            expiredStock: realExpiredStock
        };
    }));

    return productsWithBatches;
}

export async function createProduct(data: any) {
    try {
        const productData = {
            ...data,
            price: parseFloat(data.price),
            cost: parseFloat(data.cost),
            stock: parseInt(data.stock),
            minStock: parseInt(data.minStock),
            categoryId: parseInt(data.categoryId),
            expirationDate: data.expirationDate ? new Date(data.expirationDate) : null
        };

        await prisma.product.create({ data: productData });
        revalidatePath('/inventory');
        revalidatePath('/pos');
        revalidatePath('/'); // Dashboard
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Error al crear producto. Verifique código único.' };
    }
}

export async function updateProduct(id: number, data: any) {
    try {
        const productData = {
            ...data,
            price: parseFloat(data.price),
            cost: parseFloat(data.cost),
            stock: parseInt(data.stock),
            minStock: parseInt(data.minStock),
            categoryId: parseInt(data.categoryId),
            expirationDate: data.expirationDate ? new Date(data.expirationDate) : null
        };

        delete productData.id;

        await prisma.product.update({
            where: { id },
            data: productData
        });
        revalidatePath('/inventory');
        revalidatePath('/pos');
        revalidatePath('/'); // Dashboard
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar producto.' };
    }
}

export async function deleteProduct(id: number) {
    try {
        await prisma.product.delete({ where: { id } });
        revalidatePath('/inventory');
        revalidatePath('/pos');
        revalidatePath('/'); // Dashboard
        return { success: true };
    } catch (error) {
        return { success: false, error: 'No se puede eliminar. Posiblemente tenga ventas asociadas.' };
    }
}

export async function removeExpiredProduct(productId: number, quantity: number, notes: string = '') {
    const session = await getSession();
    if (!session || !session.user) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return { success: false, error: 'Producto no encontrado' };

        if (quantity > product.stock) {
            return { success: false, error: 'La cantidad excede el stock actual' };
        }

        await prisma.$transaction([
            prisma.stockAdjustment.create({
                data: {
                    productId,
                    quantity,
                    reason: 'VENCIDO',
                    notes: notes || `Baja por vencimiento. Vencía: ${product.expirationDate?.toLocaleDateString()}`,
                    userId: session.user.id
                }
            }),
            prisma.product.update({
                where: { id: productId },
                data: { stock: { decrement: quantity } }
            })
        ]);

        revalidatePath('/');
        revalidatePath('/inventory');
        revalidatePath('/reports');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Error al dar de baja stock' };
    }
}
