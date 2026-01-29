const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'farmacorp.db');
console.log('FixUser script running.');
console.log('CWD:', process.cwd());
console.log('Target DB Path:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('ERROR: Database file not found at:', dbPath);
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

async function run() {
    try {
        console.log('Connecting to database...');
        // Test connection
        const count = await prisma.user.count();
        console.log(`Users in DB: ${count}`);

        const hash = bcrypt.hashSync('admin123', 10);

        await prisma.user.upsert({
            where: { username: 'admin' },
            update: { password: hash },
            create: {
                username: 'admin',
                password: hash,
                name: 'Administrador',
                role: 'ADMIN'
            }
        });
        console.log('SUCCESS: Admin password set to "admin123"');
    } catch (e) {
        console.error('ERROR in FixUser:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
