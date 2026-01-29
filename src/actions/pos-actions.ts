'use server';

import { prisma } from '@/lib/prisma';
import { Product } from '@/lib/types'; // We might need to map Prisma type to our Frontend type or update Frontend type

export async function getProducts(query: string = '', categoryId: number | null = null) {
    const whereClause: any = {};

    if (query) {
        whereClause.OR = [
            { name: { contains: query } }, // SQL Server case insensitive usually by default depending on collation, Prisma does its best
            { code: { contains: query } },
            { barcode: { contains: query } },
        ];
    }

    if (categoryId) {
        whereClause.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
        where: whereClause,
        include: { category: true },
        orderBy: { name: 'asc' },
        take: 50 // Limit results for performance
    });

    // Map to frontend type if necessary, or just return as is.
    // Our frontend type 'Product' in types.ts roughly matches but has 'location' and 'id' as string in types.ts vs int in DB.
    // We should align them.
    return products.map(p => ({
        ...p,
        id: p.id.toString(), // Convert ID to string for frontend compatibility
        price: p.price.toNumber(), // Decimal to Number
        cost: p.cost.toNumber(),
        category: p.category.name,
        categoryId: p.categoryId,
        expirationDate: p.expirationDate ? p.expirationDate.toISOString().split('T')[0] : '',
    }));
}

export async function getCategories() {
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
    return categories;
}

export async function createCategory(name: string) {
    try {
        const existing = await prisma.category.findUnique({
            where: { name }
        });

        if (existing) {
            return { success: true, category: existing }; // Already exists, just return it
        }

        const category = await prisma.category.create({
            data: { name }
        });

        return { success: true, category };
    } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, error: 'Could not create category' };
    }
}
