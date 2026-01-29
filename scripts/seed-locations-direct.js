const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seedLocations() {
    try {
        const locationsPath = path.join(__dirname, '../lib/data/nigeria_locations.json');

        if (!fs.existsSync(locationsPath)) {
            throw new Error('Locations data file not found');
        }

        const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));
        const { states, lgas } = locationsData;

        console.log('Connecting to database...');
        await pool.query('BEGIN');

        // Clear existing data
        console.log('Truncating tables...');
        await pool.query('TRUNCATE TABLE lgas, states RESTART IDENTITY CASCADE');

        console.log(`Seeding ${states.length} states...`);
        for (const state of states) {
            await pool.query(
                'INSERT INTO states (id, name, code, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET name = $2, code = $3, updated_at = NOW()',
                [state.id, state.name, state.code]
            );
        }

        console.log(`Seeding ${lgas.length} LGAs...`);
        // Use batch insert for LGAs
        const chunkSize = 100;
        for (let i = 0; i < lgas.length; i += chunkSize) {
            const chunk = lgas.slice(i, i + chunkSize);
            const values = [];
            const placeholders = [];

            chunk.forEach((lga, idx) => {
                const offset = idx * 3;
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, NOW(), NOW())`);
                values.push(lga.id, lga.name, lga.stateId);
            });

            const query = `
        INSERT INTO lgas (id, name, state_id, created_at, updated_at) 
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, state_id = EXCLUDED.state_id, updated_at = NOW()
      `;

            await pool.query(query, values);
        }

        await pool.query('COMMIT');
        console.log('✅ Nigerian states and LGAs seeded successfully!');
        console.log(`Stats: ${states.length} States, ${lgas.length} LGAs`);

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error initializing locations:', error);
    } finally {
        pool.end();
    }
}

seedLocations();
