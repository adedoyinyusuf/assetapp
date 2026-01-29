const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is missing.');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function verify() {
    try {
        console.log('🔌 Connecting to verify user...');
        await client.connect();

        const email = 'admin@npopc.gov.ng';
        const password = 'Admin@123';

        // 1. Get User
        console.log(`🔍 Fetching user ${email}...`);
        const res = await client.query(`
      SELECT u.id, u.email, u.hashed_password, u.is_active, r.name as role_name
      FROM "users" u
      JOIN "user_roles" r ON u.role_id = r.id
      WHERE u.email = $1
    `, [email]);

        if (res.rows.length === 0) {
            console.error('❌ User NOT found in database.');
            // Check if user exists without role join?
            const userOnly = await client.query('SELECT * FROM "users" WHERE email = $1', [email]);
            if (userOnly.rows.length > 0) {
                console.error('   (User exists but Role JOIN failed. Check role_id)');
                console.log('   User Role ID:', userOnly.rows[0].role_id);
            }
            return;
        }

        const user = res.rows[0];
        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Active: ${user.is_active}`);
        console.log(`   Role: ${user.role_name}`);
        console.log(`   Hash Length: ${user.hashed_password ? user.hashed_password.length : 0}`);

        // 2. Checking Active
        if (!user.is_active) {
            console.error('❌ User is NOT active (is_active = false)');
        } else {
            console.log('✅ User is active.');
        }

        // 3. Verify Password
        console.log('🔐 Verifying password...');
        const match = await bcrypt.compare(password, user.hashed_password);

        if (match) {
            console.log('✅ PASS: Database hash matches "Admin@123"');
        } else {
            console.error('❌ FAIL: Database hash does NOT match "Admin@123"');

            // Attempt to re-hash and see what happens (debug info)
            const newHash = await bcrypt.hash(password, 12);
            console.log('   (Generated new test hash locally, but cannot update unless requested)');
        }

    } catch (err) {
        console.error('❌ Error during verification:', err);
    } finally {
        await client.end();
    }
}

verify();
