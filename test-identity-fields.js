
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Asset Creation with Identity Fields...');

    try {
        // 1. Get or Create Category
        let category = await prisma.category.findFirst();
        if (!category) {
            category = await prisma.category.create({
                data: { name: 'Electronics', description: 'Electronic devices' }
            });
            console.log('⚠️ Created dummy Category');
        }

        // 2. Get or Create State
        let state = await prisma.state.findFirst();
        if (!state) {
            state = await prisma.state.create({
                data: { name: 'Test State', code: 'TS' }
            });
            console.log('⚠️ Created dummy State');
        }

        // 3. Get or Create LGA
        let lga = await prisma.lGA.findFirst({ where: { stateId: state.id } });
        if (!lga) {
            lga = await prisma.lGA.create({
                data: { name: 'Test LGA', stateId: state.id }
            });
            console.log('⚠️ Created dummy LGA');
        }

        // 4. Create Asset directly via Prisma
        const asset = await prisma.asset.create({
            data: {
                name: 'Test Identity Asset',
                purchaseValue: 50000,
                purchaseDate: new Date(),
                usefulLife: 3,
                salvageValue: 5000,
                categoryId: category.id,
                stateId: state.id,
                lgaId: lga.id,
                // New Fields
                serialNumber: `SN-${Date.now()}`,
                batchNumber: 'BATCH-TEST-001',
                referenceNumber: 'REF-TEST-001',
                imei1: '354890000000001',
                imei2: '354890000000002',
                assetCode: `AST-TEST-${Date.now()}`,
                currentValue: 50000 // Required field
            }
        });

        console.log('✅ Asset Created:', {
            id: asset.id,
            assetCode: asset.assetCode,
            serialNumber: asset.serialNumber,
            batchNumber: asset.batchNumber,
            referenceNumber: asset.referenceNumber,
            imei1: asset.imei1,
            imei2: asset.imei2
        });

        if (!asset.assetCode) throw new Error('Asset Code was not generated!');
        if (asset.batchNumber !== 'BATCH-TEST-001') throw new Error('Batch Number mismatch!');
        if (asset.imei1 !== '354890000000001') throw new Error('IMEI 1 mismatch!');
        if (asset.imei2 !== '354890000000002') throw new Error('IMEI 2 mismatch!');

        // Clean up
        await prisma.asset.delete({ where: { id: asset.id } });
        console.log('🧹 Test Asset Cleaned Up');

    } catch (e) {
        console.error('❌ Test Failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
