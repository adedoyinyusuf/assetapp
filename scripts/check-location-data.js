const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkStates() {
    try {
        const res = await pool.query('SELECT id, name FROM states ORDER BY id LIMIT 5');
        console.log('Current States in DB:', res.rows);

        const countRes = await pool.query('SELECT COUNT(*) FROM assets');
        console.log('Total Assets:', countRes.rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkStates();
