
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.cashRegister.findFirst();
    if (!existing) {
        console.log('Creating default Cash Registers...');
        await prisma.cashRegister.createMany({
            data: [
                { name: 'Caja 01', location: 'Mostrador Principal' },
                { name: 'Caja 02', location: 'Farmacia' },
                { name: 'Caja 03', location: 'Autoservicio' },
            ]
        });
        console.log('Done.');
    } else {
        console.log('Cash Registers already exist.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
