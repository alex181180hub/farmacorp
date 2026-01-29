const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma/local.db');
console.log('Checking local.db at:', dbPath);

const prisma = new PrismaClient({
    datasources: { db: { url: `file:${dbPath}` } }
});

async function main() {
    try {
        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
        console.log('Tables in local.db:', tables.length);
        tables.forEach(t => console.log(' - ' + t.name));

        const userCount = await prisma.user.count();
        console.log('Users:', userCount);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
