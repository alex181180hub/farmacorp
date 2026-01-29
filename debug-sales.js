
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSales() {
    console.log('Checking Sales...');
    const sales = await prisma.sale.findMany({
        include: { user: true }
    });

    if (sales.length === 0) {
        console.log('No sales found in database.');
    } else {
        console.log(`Found ${sales.length} sales.`);
        sales.forEach(s => {
            console.log(`ID: ${s.id}, Date: ${s.date}, Total: ${s.total}, UserId: ${s.userId} (${s.user?.name}), Status: ${s.status}`);
        });
    }

    const users = await prisma.user.findMany();
    console.log('\nUsers:');
    users.forEach(u => console.log(`ID: ${u.id}, Name: ${u.name}, Username: ${u.username}`));
}

checkSales()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
