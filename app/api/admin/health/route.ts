import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection and get tables
    const [tables, roles, users] = await Promise.all([
      prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `,
      prisma.userRole.findMany({ take: 1 }),
      prisma.user.findMany({ take: 1 }),
    ]);

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        tables: tables,
        hasRoles: roles.length > 0,
        hasUsers: users.length > 0,
      },
    });
  } catch (error: unknown) {
    console.error('Database health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
