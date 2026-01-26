
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const conflicts = await prisma.state.findMany({
        where: {
            OR: [
                { code: 'FC' },
                { name: 'FCT' },
                { name: 'Abuja' }
            ]
        }
    });
    console.log('Conflicting States:', conflicts);
}

main().finally(() => prisma.$disconnect());
