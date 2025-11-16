import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

// Input validation schemas
const stateSchema = z.object({
  name: z.string().min(1, 'State name is required'),
  code: z.string().min(2, 'State code must be at least 2 characters').max(10, 'State code too long'),
});

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  search: z.string().optional(),
});

// GET - Retrieve states with optional search and pagination
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const validation = querySchema.safeParse(query);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, search } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch states and total count
    const [states, total] = await Promise.all([
      prisma.state.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              assets: true,
              lgas: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.state.count({ where: whereClause }),
    ]);

    // Format states
    const formattedStates = states.map((state) => ({
      id: state.id,
      name: state.name,
      code: state.code,
      assetCount: state._count.assets,
      lgaCount: state._count.lgas,
      createdAt: state.createdAt.toISOString(),
      updatedAt: state.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: formattedStates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}

// POST - Create a new state
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const validation = stateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if state with same name or code already exists
    const existingState = await prisma.state.findFirst({
      where: {
        OR: [
          { name: { equals: data.name, mode: 'insensitive' } },
          { code: { equals: data.code, mode: 'insensitive' } },
        ],
      },
    });

    if (existingState) {
      if (existingState.name.toLowerCase() === data.name.toLowerCase()) {
        return NextResponse.json(
          { error: 'A state with this name already exists' },
          { status: 409 }
        );
      }
      if (existingState.code.toLowerCase() === data.code.toLowerCase()) {
        return NextResponse.json(
          { error: 'A state with this code already exists' },
          { status: 409 }
        );
      }
    }

    // Create state
    const state = await prisma.state.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
      },
      include: {
        _count: {
          select: {
            assets: true,
            lgas: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_STATE',
        entityType: 'State',
        entityId: state.id,
        newValues: {
          name: state.name,
          code: state.code,
        },
      },
    });

    return NextResponse.json({
      id: state.id,
      name: state.name,
      code: state.code,
      assetCount: state._count.assets,
      lgaCount: state._count.lgas,
      createdAt: state.createdAt.toISOString(),
      updatedAt: state.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating state:', error);
    return NextResponse.json(
      { error: 'Failed to create state' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing state
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const validation = stateSchema.extend({
      id: z.number().int().positive(),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    // Check if state exists
    const existingState = await prisma.state.findUnique({ where: { id } });
    if (!existingState) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if another state with same name or code already exists
    const duplicateState = await prisma.state.findFirst({
      where: {
        id: { not: id },
        OR: [
          { name: { equals: data.name, mode: 'insensitive' } },
          { code: { equals: data.code, mode: 'insensitive' } },
        ],
      },
    });

    if (duplicateState) {
      if (duplicateState.name.toLowerCase() === data.name.toLowerCase()) {
        return NextResponse.json(
          { error: 'Another state with this name already exists' },
          { status: 409 }
        );
      }
      if (duplicateState.code.toLowerCase() === data.code.toLowerCase()) {
        return NextResponse.json(
          { error: 'Another state with this code already exists' },
          { status: 409 }
        );
      }
    }

    // Update state
    const state = await prisma.state.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
      },
      include: {
        _count: {
          select: {
            assets: true,
            lgas: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_STATE',
        entityType: 'State',
        entityId: state.id,
        oldValues: {
          name: existingState.name,
          code: existingState.code,
        },
        newValues: {
          name: state.name,
          code: state.code,
        },
      },
    });

    return NextResponse.json({
      id: state.id,
      name: state.name,
      code: state.code,
      assetCount: state._count.assets,
      lgaCount: state._count.lgas,
      createdAt: state.createdAt.toISOString(),
      updatedAt: state.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating state:', error);
    return NextResponse.json(
      { error: 'Failed to update state' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a state
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has super admin privileges
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Only super admins can delete states' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'State ID is required' }, { status: 400 });
    }

    const stateId = parseInt(id);
    if (isNaN(stateId)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    // Check if state exists
    const state = await prisma.state.findUnique({
      where: { id: stateId },
      include: {
        _count: {
          select: {
            assets: true,
            lgas: true,
          },
        },
      },
    });

    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if state has associated assets or LGAs
    if (state._count.assets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete state with associated assets' },
        { status: 400 }
      );
    }

    if (state._count.lgas > 0) {
      return NextResponse.json(
        { error: 'Cannot delete state with associated LGAs' },
        { status: 400 }
      );
    }

    // Delete the state
    await prisma.state.delete({ where: { id: stateId } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_STATE',
        entityType: 'State',
        entityId: stateId,
        oldValues: {
          name: state.name,
          code: state.code,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting state:', error);
    return NextResponse.json(
      { error: 'Failed to delete state' },
      { status: 500 }
    );
  }
}
