'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCustomers(query: string = '') {
    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { razonSocial: { contains: query } },
                { nit: { contains: query } },
            ],
        },
        orderBy: { createdAt: 'desc' },
    });

    return customers;
}

export async function createCustomer(data: {
    nit: string;
    razonSocial: string;
    email?: string;
    phone?: string;
}) {
    try {
        await prisma.customer.create({
            data,
        });
        revalidatePath('/customers');
        return { success: true };
    } catch (error) {
        console.error('Error creating customer:', error);
        return { success: false, error: 'Failed to create customer. NIT might already exist.' };
    }
}

export async function deleteCustomer(id: number) {
    try {
        await prisma.customer.delete({ where: { id } });
        revalidatePath('/customers');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete customer' };
    }
}
