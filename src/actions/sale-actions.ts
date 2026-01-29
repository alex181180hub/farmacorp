'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateCUF, generateQRContent } from '@/lib/billing';
import { revalidatePath } from 'next/cache';
import { getOpenShift } from '@/actions/shift-actions';

export async function processSale(data: {
    customerNit: string | null;
    customerName: string;
    items: { id: string; quantity: number; price: number; discount: number }[];
    total: number;
    invoiceType: 'FACTURA' | 'RECIBO';
    paymentMethod: 'EFECTIVO' | 'QR';
}) {
    try {
        // 1. Get Current User from Session
        const session = await getSession();
        let userId: number;

        if (session && session.user && session.user.id) {
            userId = parseInt(session.user.id);
        } else {
            // Fallback for dev/test without login
            const user = await prisma.user.findFirst();
            if (!user) {
                const newUser = await prisma.user.create({
                    data: {
                        name: 'Cajero Principal',
                        username: 'admin',
                        password: 'password123',
                        role: 'Admin'
                    }
                });
                userId = newUser.id;
            } else {
                userId = user.id;
            }
        }

        // Check Open Shift
        const currentShift = await getOpenShift(userId);
        if (!currentShift) {
            return { success: false, error: 'Debe abrir caja para realizar ventas.' };
        }

        // 2. Get or Create Customer
        let customerId: number | null = null;
        const nitToUse = data.customerNit && data.customerNit !== '0' ? data.customerNit : '0';

        const existingCustomer = await prisma.customer.findFirst({
            where: { nit: nitToUse }
        });

        if (existingCustomer) {
            customerId = existingCustomer.id;
        } else {
            const newCust = await prisma.customer.create({
                data: {
                    nit: nitToUse,
                    razonSocial: data.customerName || 'SIN NOMBRE',
                }
            });
            customerId = newCust.id;
        }

        // 3. Generate Invoice Data
        const lastSale = await prisma.sale.findFirst({ orderBy: { id: 'desc' } });
        const nextInvoiceNumber = ((lastSale?.id || 0) + 1).toString();

        // Condition logic: If RECIBO, we don't need real CUF or Control Code
        const isFactura = data.invoiceType === 'FACTURA';
        const cuf = isFactura ? generateCUF(nextInvoiceNumber) : '0';
        const controlCode = isFactura ? 'D-A-7-C' : '';

        // 4. Create Sale Transaction
        const sale = await prisma.sale.create({
            data: {
                date: new Date(),
                subtotal: data.total,
                total: data.total,
                paymentMethod: data.paymentMethod,
                status: 'COMPLETADA',
                userId: userId,
                customerId: customerId,
                invoiceNumber: nextInvoiceNumber,
                cuf: cuf,
                controlCode: controlCode,
                shiftId: currentShift.id, // Link to Shift
                items: {
                    create: data.items.map(item => ({
                        productId: parseInt(item.id),
                        quantity: item.quantity,
                        price: item.price,
                        discount: item.discount
                    }))
                }
            },
            include: {
                items: {
                    include: { product: true }
                },
                customer: true,
                user: true
            }
        });

        // 5. Update Stock
        for (const item of data.items) {
            await prisma.product.update({
                where: { id: parseInt(item.id) },
                data: { stock: { decrement: item.quantity } }
            });
        }

        // 6. Build Response & Deep Serialization
        const serializedSale = {
            ...sale,
            id: sale.id.toString(),
            subtotal: sale.subtotal.toNumber(),
            total: sale.total.toNumber(),
            date: sale.date.toISOString(),
            saleType: data.invoiceType, // Pass this back so UI knows layout
            items: sale.items.map(item => ({
                ...item,
                price: item.price.toNumber(),
                discount: item.discount.toNumber(),
                product: {
                    ...item.product,
                    price: item.product.price.toNumber(),
                    cost: item.product.cost.toNumber(),
                }
            }))
        };

        let qrContent = '';
        if (isFactura) {
            qrContent = generateQRContent(
                '1020304050',
                cuf,
                nextInvoiceNumber,
                sale.date,
                data.total,
                sale.controlCode!,
                sale.customer?.nit || '0'
            );
        }

        revalidatePath('/pos');
        revalidatePath('/inventory');
        revalidatePath('/'); // Update Dashboard

        return {
            success: true,
            sale: serializedSale,
            qr: qrContent
        };

    } catch (error: any) {
        console.error('Sale Error Detailed:', error);
        return { success: false, error: error.message || 'Error processing sales transaction.' };
    }
}
