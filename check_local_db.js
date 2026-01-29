const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma/local.db');
console.log('Checking DB at:', dbPath);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

async function run() {
    try {
        const count = await prisma.user.count();
        console.log('User count:', count);

        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
        console.log('Tables:', tables);

        if (count > 0 && tables.length > 0) {
            console.log('DB IS VALID');
        } else {
            console.log('DB IS EMPTY OR INVALID');
        }
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
