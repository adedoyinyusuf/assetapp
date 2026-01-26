
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const testLgas = await prisma.lGA.findMany({
        where: {
            name: {
                contains: 'Test',
                mode: 'insensitive'
            }
        },
        include: {
            state: true
        }
    });

    console.log('Found Test LGAs:', testLgas);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
