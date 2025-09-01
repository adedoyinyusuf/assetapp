import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Get audit logs with filtering and pagination
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    const whereClause = {
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(userId && { userId: parseInt(userId) }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    // Transform the data to match the frontend expectations
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      timestamp: log.createdAt,
      oldValues: log.oldValues || {},
      newValues: log.newValues || {},
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      user: log.user
        ? {
            id: log.user.id,
            name: [log.user.firstName, log.user.lastName].filter(Boolean).join(' ') || 'Unknown',
            email: log.user.email,
          }
        : null,
    }));

    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Create an audit log entry
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { action, entityType, entityId, oldValues, newValues, ipAddress, userAgent } = await req.json();

    if (!action) {
      return new NextResponse('Action is required', { status: 400 });
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action,
        entityType,
        entityId: entityId ? parseInt(entityId) : null,
        oldValues: oldValues || {},
        newValues: newValues || {},
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Format the response to match the frontend expectations
    const response = {
      ...auditLog,
      timestamp: auditLog.createdAt,
      user: auditLog.user
        ? {
            id: auditLog.user.id,
            name: [auditLog.user.firstName, auditLog.user.lastName].filter(Boolean).join(' ') || 'Unknown',
            email: auditLog.user.email,
          }
        : null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
