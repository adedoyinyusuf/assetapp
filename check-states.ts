
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const states = await prisma.state.findMany();
    console.log('Current States in DB:');
    console.table(states);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
