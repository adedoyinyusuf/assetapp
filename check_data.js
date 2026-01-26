
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const stateCount = await prisma.state.count();
        const lgaCount = await prisma.lGA.count();
        console.log(`States found: ${stateCount}`);

        if (stateCount > 0) {
            const states = await prisma.state.findMany();
            console.log('Existing states:', JSON.stringify(states, null, 2));
        }

        console.log(`LGAs found: ${lgaCount}`);
    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
