'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function createPurchase(data: {
    supplierName?: string;
    items: {
        productId: number;
        quantity: number;
        cost: number;
        lotNumber?: string;
        expirationDate?: Date;
    }[];
}) {
    try {
        const session = await getSession();
        if (!session || !session.user || !session.user.id) {
            return { success: false, error: 'Sesión no válida o expirada. Por favor inicie sesión nuevamente.' };
        }

        const userId = Number(session.user.id);

        if (!data.items || data.items.length === 0) {
            return { success: false, error: 'No hay items en la compra.' };
        }

        console.log('Processing purchase for user:', userId, 'Items:', data.items.length);

        // Calculate total
        const total = data.items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

        // Execute in transaction to ensure consistency
        const purchaseId = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase with items
            const purchase = await tx.purchase.create({
                data: {
                    userId: userId,
                    total: total,
                    status: 'COMPLETADA',
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            cost: item.cost,
                            lotNumber: item.lotNumber,
                            expirationDate: item.expirationDate
                        }))
                    }
                }
            });

            // 2. Update Product Stock and Expiration
            for (const item of data.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        cost: item.cost,
                        ...(item.expirationDate ? { expirationDate: item.expirationDate } : {})
                    }
                });
            }

            return purchase.id;
        });

        console.log('Purchase created successfully:', purchaseId);

        revalidatePath('/inventory');
        revalidatePath('/');
        revalidatePath('/purchases');

        return { success: true, purchaseId };

    } catch (error: any) {
        console.error('Purchase error detailed:', error);
        return { success: false, error: `Error al registrar la compra: ${error.message || 'Error desconocido'}` };
    }
}

export async function getPurchases() {
    try {
        const session = await getSession();
        if (!session) return { success: false, error: 'No autorizado' };

        // For now, return all purchases. In production, maybe filter by user or date.
        const purchases = await prisma.purchase.findMany({
            include: {
                user: {
                    select: { name: true }
                },
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { date: 'desc' },
            take: 50
        });

        return { success: true, purchases };
    } catch (error) {
        console.error('Error fetching purchases:', error);
        return { success: false, error: 'Error al obtener historial de compras' };
    }
}

export async function getPurchaseDetails(id: number) {
    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true, code: true }
                        }
                    }
                }
            }
        });

        if (!purchase) return { success: false, error: 'Compra no encontrada' };

        return { success: true, purchase };
    } catch (error) {
        return { success: false, error: 'Error al obtener detalles' };
    }
}

export async function updatePurchase(purchaseId: number, data: {
    items: {
        productId: number;
        quantity: number;
        cost: number;
        lotNumber?: string;
        expirationDate?: Date;
    }[];
}) {
    // 1. Validate Session
    const session = await getSession();
    if (!session || !session.user) {
        return { success: false, error: 'Sesión expirada.' };
    }

    if (!data.items || data.items.length === 0) {
        return { success: false, error: 'La compra debe tener items.' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 2. Fetch Original Purchase to Revert Stock
            const originalPurchase = await tx.purchase.findUnique({
                where: { id: purchaseId },
                include: { items: true }
            });

            if (!originalPurchase) {
                throw new Error('Compra original no encontrada.');
            }

            // 3. Revert Stock (Subtract original quantities)
            for (const item of originalPurchase.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity }
                    }
                });
            }

            // 4. Delete Original Items
            await tx.purchaseItem.deleteMany({
                where: { purchaseId: purchaseId }
            });

            // 5. Create New Items & Calculate New Total
            const newTotal = data.items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

            await tx.purchase.update({
                where: { id: purchaseId },
                data: {
                    total: newTotal,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            cost: item.cost,
                            lotNumber: item.lotNumber,
                            expirationDate: item.expirationDate
                        }))
                    }
                }
            });

            // 6. Apply New Stock (Add new quantities)
            for (const item of data.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        cost: item.cost, // Update last cost
                        ...(item.expirationDate ? { expirationDate: item.expirationDate } : {})
                    }
                });
            }
        });

        revalidatePath('/inventory');
        revalidatePath('/');
        revalidatePath('/purchases');

        return { success: true };

    } catch (error: any) {
        console.error('Update Purchase Error:', error);
        return { success: false, error: error.message || 'Error al actualizar la compra.' };
    }
}
