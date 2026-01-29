const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: { db: { url: 'file:./prisma/farmacorp.db' } }
});

async function main() {
    try {
        console.log('Checking prisma/farmacorp.db...');
        // Raw query to list tables in SQLite
        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
        console.log('Tables found:', tables);

        const userCount = await prisma.user.count();
        console.log('User count:', userCount);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
