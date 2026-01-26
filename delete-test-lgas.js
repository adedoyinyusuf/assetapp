
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const testLgas = await prisma.lGA.findMany({
        where: {
            name: {
                contains: 'Test',
                mode: 'insensitive'
            }
        }
    });

    console.log(`Found ${testLgas.length} Test LGAs to delete.`);

    for (const lga of testLgas) {
        // Check for assets in this LGA
        const assetsCount = await prisma.asset.count({ where: { lgaId: lga.id } });
        if (assetsCount > 0) {
            console.log(`⚠️ LGA '${lga.name}' has ${assetsCount} assets. Deleting assets first...`);
            await prisma.asset.deleteMany({ where: { lgaId: lga.id } });
        }

        await prisma.lGA.delete({ where: { id: lga.id } });
        console.log(`✅ Deleted LGA: ${lga.name}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
