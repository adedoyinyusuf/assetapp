const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🚀 Starting MDM migration...');

        // Read the migration file - use path relative to project root
        const migrationPath = path.join(__dirname, 'migrations', 'mdm-module-migration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration file loaded');

        // Execute the migration
        await pool.query(migrationSQL);

        console.log('✅ MDM migration completed successfully!');
        console.log('📊 Created tables: mobile_devices, staff_users, device_assignments, sim_cards, device_commands, device_maintenance');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
