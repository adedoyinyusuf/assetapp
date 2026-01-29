const { Pool } = require('pg');
const { hash } = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function resetPassword() {
    try {
        const email = 'admin@npopc.gov.ng';
        const password = 'Admin@123';

        console.log(`Resetting password for ${email}...`);
        const hashedPassword = await hash(password, 12);

        const res = await pool.query(
            `UPDATE users 
       SET hashed_password = $1, is_active = true, updated_at = NOW()
       WHERE email = $2
       RETURNING id, email`,
            [hashedPassword, email]
        );

        if (res.rows.length > 0) {
            console.log('✅ Password updated successfully for:', res.rows[0].email);
        } else {
            console.error('❌ User not found:', email);
        }

    } catch (error) {
        console.error('❌ Error resetting password:', error);
    } finally {
        pool.end();
    }
}

resetPassword();
