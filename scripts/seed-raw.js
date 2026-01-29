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

async function seed() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected.');

        const email = 'admin@npopc.gov.ng';
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log('🔑 Hashing password...');

        // 1. Ensure Role Exists
        console.log('🛡️  Ensuring SUPERADMIN role exists...');
        // We need to check if it exists first because we don't know if the ID is UUID or AutoInc in raw SQL without schema knowledge, 
        // but based on previous Prisma logs, it seemed tables exist.
        // Let's assume standard UserRole table based on previous seed.ts

        // Check if role exists
        const roleRes = await client.query('SELECT id FROM "user_roles" WHERE name = $1', ['SUPERADMIN']);
        let roleId;

        if (roleRes.rows.length > 0) {
            roleId = roleRes.rows[0].id;
            console.log(`   Found existing role ID: ${roleId}`);
        } else {
            // Create role
            try {
                const insertRoleRes = await client.query(
                    'INSERT INTO "user_roles" (name, description, "created_at", "updated_at") VALUES ($1, $2, NOW(), NOW()) RETURNING id',
                    ['SUPERADMIN', 'Full system access']
                );
                roleId = insertRoleRes.rows[0].id;
                console.log(`   Created new role ID: ${roleId}`);
            } catch (e) {
                console.log('   Error creating role:', e);
                throw e;
            }
        }

        // 2. Ensure User Exists
        console.log(`👤 Upserting user ${email}...`);
        // Note: Column names are snake_case in DB
        const userRes = await client.query('SELECT id FROM "users" WHERE email = $1', [email]);

        if (userRes.rows.length > 0) {
            console.log('   User exists. Updating password...');
            await client.query(
                'UPDATE "users" SET "hashed_password" = $1, "role_id" = $2, "is_active" = true, "first_name" = $3, "last_name" = $4 WHERE email = $5',
                [hashedPassword, roleId, 'Admin', 'User', email]
            );
            console.log('✅ User updated.');
        } else {
            console.log('   Creating new user...');
            await client.query(
                'INSERT INTO "users" (email, "hashed_password", "role_id", "first_name", "last_name", "is_active", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())',
                [email, hashedPassword, roleId, 'Admin', 'User']
            );
            console.log('✅ User created.');
        }

        console.log('🎉 Seeding completed successfully!');
        console.log(`👉 Login with: ${email} / ${password}`);

    } catch (err) {
        console.error('❌ Error during raw seeding:', err);
    } finally {
        await client.end();
    }
}

seed();
