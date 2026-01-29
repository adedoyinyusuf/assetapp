const { Pool } = require('pg');
const { hash } = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function restoreUsers() {
    try {
        console.log('Connecting to database...');

        // 1. Restore Roles
        const roles = [
            { name: 'VIEWER', description: 'Can view assets and basic reports' },
            { name: 'OPERATOR', description: 'Can manage assets and view reports' },
            { name: 'MANAGER', description: 'Can manage assets, categories, and view all reports' },
            { name: 'ADMIN', description: 'Full access to all features' },
            { name: 'SUPERADMIN', description: 'Full system access including user management' },
        ];

        console.log('Restoring Roles...');
        for (const role of roles) {
            await pool.query(
                `INSERT INTO user_roles (name, description, created_at, updated_at) 
         VALUES ($1, $2, NOW(), NOW()) 
         ON CONFLICT (name) DO UPDATE SET description = $2`,
                [role.name, role.description]
            );
        }

        // 2. Restore Users
        const users = [
            {
                email: 'super.admin@npopc.gov.ng',
                firstName: 'Super',
                lastName: 'Admin',
                password: 'SuperAdmin@123',
                roleName: 'SUPERADMIN',
            },
            {
                email: 'admin@npopc.gov.ng',
                firstName: 'Admin',
                lastName: 'User',
                password: 'Admin@123',
                roleName: 'ADMIN',
            },
            {
                email: 'manager@npopc.gov.ng',
                firstName: 'Department',
                lastName: 'Manager',
                password: 'Manager@123',
                roleName: 'MANAGER',
            },
            {
                email: 'operator@npopc.gov.ng',
                firstName: 'Asset',
                lastName: 'Operator',
                password: 'Operator@123',
                roleName: 'OPERATOR',
            },
            {
                email: 'viewer@npopc.gov.ng',
                firstName: 'Read-Only',
                lastName: 'User',
                password: 'Viewer@123',
                roleName: 'VIEWER',
            },
        ];

        console.log('Restoring Users...');
        for (const user of users) {
            // Get Role ID
            const roleRes = await pool.query('SELECT id FROM user_roles WHERE name = $1', [user.roleName]);
            if (roleRes.rows.length === 0) {
                console.warn(`Role ${user.roleName} not found, skipping user ${user.email}`);
                continue;
            }
            const roleId = roleRes.rows[0].id;

            // Hash Password
            const hashedPassword = await hash(user.password, 12);

            // Insert User
            await pool.query(
                `INSERT INTO users (email, first_name, last_name, hashed_password, role_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET 
           hashed_password = $4,
           role_id = $5,
           is_active = true`,
                [user.email, user.firstName, user.lastName, hashedPassword, roleId]
            );
            console.log(`✅ Restored user: ${user.email}`);
        }

        console.log('✅ User restoration completed successfully!');

    } catch (error) {
        console.error('❌ Error restoring users:', error);
    } finally {
        pool.end();
    }
}

restoreUsers();
