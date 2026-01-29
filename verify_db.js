const { PrismaClient } = require('@prisma/client');

async function check(path) {
    console.log(`Checking DB at: ${path}`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: `file:${path}`
            }
        }
    });
    try {
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    await check('./prisma/farmacorp.db');
    await check('./farmacorp.db');
}

main();
