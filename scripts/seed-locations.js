
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is missing.');
    process.exit(1);
}

const client = new Client({
    connectionString: databaseUrl,
});


const nigeriaData = require('./nigeria-data');

// ...

async function seedLocations() {
    try {
        await client.connect();
        console.log('🔌 Connected to database...');

        for (const stateItem of nigeriaData) {
            const stateName = stateItem.state;
            const stateCode = stateItem.code; // Use explicit code from data
            console.log(`Processing State: ${stateName}`);


            // Robust State Resolution
            let stateId;

            // 1. Try finding by CODE
            const codeCheck = await client.query('SELECT id, name FROM states WHERE code = $1', [stateCode]);

            if (codeCheck.rows.length > 0) {
                stateId = codeCheck.rows[0].id;
                // Optional: Update name if it differs (e.g. Abuja -> FCT)
                if (codeCheck.rows[0].name !== stateName) {
                    await client.query('UPDATE states SET name = $1, updated_at = NOW() WHERE id = $2', [stateName, stateId]);
                    console.log(`   🔄 Updated State Name: ${codeCheck.rows[0].name} -> ${stateName}`);
                }
            } else {
                // 2. Try finding by NAME
                const nameCheck = await client.query('SELECT id FROM states WHERE name = $1', [stateName]);

                if (nameCheck.rows.length > 0) {
                    stateId = nameCheck.rows[0].id;
                    // Update Code
                    await client.query('UPDATE states SET code = $1, updated_at = NOW() WHERE id = $2', [stateCode, stateId]);
                    console.log(`   🔄 Updated State Code for ${stateName}: ${stateCode}`);
                } else {
                    // 3. Insert New
                    const insertRes = await client.query(
                        `INSERT INTO states (name, code, updated_at) VALUES ($1, $2, NOW()) RETURNING id`,
                        [stateName, stateCode]
                    );
                    stateId = insertRes.rows[0].id;
                    console.log(`   ✨ Created New State: ${stateName}`);
                }
            }

            for (const lgaName of stateItem.lgas) {
                // Check existence first to avoid constraint syntax issues
                const lgaCheck = await client.query(
                    'SELECT id FROM lgas WHERE name = $1 AND state_id = $2',
                    [lgaName, stateId]
                );

                if (lgaCheck.rows.length === 0) {
                    await client.query(
                        `INSERT INTO lgas (name, state_id, updated_at) VALUES ($1, $2, NOW())`,
                        [lgaName, stateId]
                    );
                }
            }
            console.log(`   ✅ Seeded ${stateItem.lgas.length} LGAs.`);
        }

        // ...

        console.log('✅ Seeding Locations Completed!');

    } catch (err) {
        console.error('❌ Seeding Error:', err.message);
        console.error('   Detail:', err.detail);
        console.error('   Table:', err.table);
        console.error('   Hint:', err.hint);
    } finally {
        await client.end();
    }
}

seedLocations();
