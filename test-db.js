const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connection successful');

    // Test a simple query
    client.query('SELECT COUNT(*) FROM assets', (err, result) => {
        release();
        if (err) {
            console.error('❌ Query failed:', err.message);
            process.exit(1);
        }
        console.log('✅ Query successful. Asset count:', result.rows[0].count);
        pool.end();
    });
});
