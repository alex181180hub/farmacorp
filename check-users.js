
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    users.forEach(u => {
        console.log(`ID: ${u.id}, User: ${u.username}, Role: ${u.role}, PassHash: ${u.password.substring(0, 10)}...`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
