
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User found:', user.username);
    console.log('Stored Hash:', user.password);

    const isValid = bcrypt.compareSync('admin123', user.password);
    console.log('Testing "admin123":', isValid);

    const isValid2 = bcrypt.compareSync('admin', user.password);
    console.log('Testing "admin":', isValid2);
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
