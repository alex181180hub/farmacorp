import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create Categories
    const analgesicos = await prisma.category.upsert({
        where: { name: 'Analgésicos' },
        update: {},
        create: { name: 'Analgésicos' },
    });

    const antibioticos = await prisma.category.upsert({
        where: { name: 'Antibióticos' },
        update: {},
        create: { name: 'Antibióticos' },
    });

    // Create Products
    const products = [
        {
            code: 'MED-001',
            barcode: '7770001',
            name: 'Paracetamol 500mg',
            categoryId: analgesicos.id,
            price: 2.50,
            cost: 1.50,
            stock: 150,
            minStock: 20,
            requiresPrescription: false,
            expirationDate: new Date('2025-12-01'),
            location: 'Estante A-1'
        },
        {
            code: 'MED-003',
            barcode: '7770003',
            name: 'Amoxicilina 500mg',
            categoryId: antibioticos.id,
            price: 5.50,
            cost: 3.50,
            stock: 45,
            minStock: 10,
            requiresPrescription: true,
            expirationDate: new Date('2025-05-20'),
            location: 'Estante B-1'
        }
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { code: p.code },
            update: {},
            create: p,
        });
    }

    // Create Customer
    await prisma.customer.upsert({
        where: { nit: '123456023' },
        update: {},
        create: {
            nit: '123456023',
            razonSocial: 'Juan Perez',
            email: 'juan@example.com'
        }
    });

    // Create Admin User
    // Note: In a real app, use bcrypt to hash. Here we Mock or use a simple string if not using bcrypt in seed,
    // BUT our login action EXPECTS bcrypt. hash. 
    // We cannot easily import bcrypt here if module resolution is messy.
    // Let's try to dynamic import or just string manipulation? 
    // No, I will try to use bcryptjs.
    const { hashSync } = require('bcryptjs');
    const hashedPassword = hashSync('admin123', 10);

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword,
        },
        create: {
            name: 'Administrador',
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
