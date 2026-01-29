const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function check() {
    try {
        const user = await prisma.user.findUnique({
            where: { username: 'admin' }
        });
        console.log('User found:', user);
        if (user) {
            const valid = bcrypt.compareSync('admin123', user.password);
            console.log('Password valid:', valid);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
