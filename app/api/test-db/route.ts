import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'asset_mgt_db',
  password: '11220099',
  port: 5433,
});

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Test basic connection
    const versionResult = await client.query('SELECT version()');
    
    // Test basic query
    const result = await client.query('SELECT COUNT(*) as user_count FROM users');
    const userCount = result.rows[0].user_count;
    
    // Test user query
    const usersResult = await client.query(`
      SELECT u.email, r.name as role
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      LIMIT 5
    `);
    
    // Test direct table access
    const directUsersResult = await client.query('SELECT email FROM users LIMIT 3');
    
    client.release();
    
    return NextResponse.json({
      success: true,
      version: versionResult.rows[0].version,
      userCount,
      users: usersResult.rows,
      directUsers: directUsersResult.rows,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 });
  }
}
