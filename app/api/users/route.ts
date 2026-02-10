import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const roleFilter = searchParams.get('role');
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {
            isActive: true,
        };

        // Filter by verification roles if specified
        if (roleFilter === 'verification') {
            where.role = {
                name: {
                    in: [
                        'VERIFIER',
                        'SENIOR_VERIFIER',
                        'ASSISTANT_VERIFIER',
                        'TEAM_LEADER',
                        'QUALITY_CONTROLLER',
                        'OBSERVER',
                        'AUDITOR_VERIFIER',
                    ],
                },
            };
        }

        // Search filter
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Fetch users
        const users = await db.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' },
            ],
            take: 100, // Limit to 100 users
        });

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch users',
            },
            { status: 500 }
        );
    }
}
