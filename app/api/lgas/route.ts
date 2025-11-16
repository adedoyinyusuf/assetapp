import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

// Input validation schemas
const lgaSchema = z.object({
  name: z.string().min(1, 'LGA name is required'),
  stateId: z.number().int().positive('State ID is required'),
});

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  search: z.string().optional(),
  stateId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET - Retrieve LGAs with optional filtering by state, search and pagination
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

    const { page, limit, search, stateId } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (stateId) {
      whereClause.stateId = stateId;
    }
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Fetch LGAs and total count
    const [lgas, total] = await Promise.all([
      prisma.lGA.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          state: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              assets: true,
            },
          },
        },
        orderBy: [
          { state: { name: 'asc' } },
          { name: 'asc' },
        ],
      }),
      prisma.lGA.count({ where: whereClause }),
    ]);

    // Format LGAs
    const formattedLGAs = lgas.map((lga) => ({
      id: lga.id,
      name: lga.name,
      stateId: lga.stateId,
      state: lga.state,
      assetCount: lga._count.assets,
      createdAt: lga.createdAt.toISOString(),
      updatedAt: lga.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: formattedLGAs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching LGAs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LGAs' },
      { status: 500 }
    );
  }
}

// POST - Create a new LGA
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
    const validation = lgaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify that the state exists
    const state = await prisma.state.findUnique({ where: { id: data.stateId } });
    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if LGA with same name already exists in this state
    const existingLGA = await prisma.lGA.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        stateId: data.stateId,
      },
    });

    if (existingLGA) {
      return NextResponse.json(
        { error: 'An LGA with this name already exists in this state' },
        { status: 409 }
      );
    }

    // Create LGA
    const lga = await prisma.lGA.create({
      data: {
        name: data.name,
        stateId: data.stateId,
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_LGA',
        entityType: 'LGA',
        entityId: lga.id,
        newValues: {
          name: lga.name,
          stateId: lga.stateId,
          stateName: lga.state.name,
        },
      },
    });

    return NextResponse.json({
      id: lga.id,
      name: lga.name,
      stateId: lga.stateId,
      state: lga.state,
      assetCount: lga._count.assets,
      createdAt: lga.createdAt.toISOString(),
      updatedAt: lga.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating LGA:', error);
    return NextResponse.json(
      { error: 'Failed to create LGA' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing LGA
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
    const validation = lgaSchema.extend({
      id: z.number().int().positive(),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    // Check if LGA exists
    const existingLGA = await prisma.lGA.findUnique({ 
      where: { id },
      include: { state: true }
    });
    if (!existingLGA) {
      return NextResponse.json({ error: 'LGA not found' }, { status: 404 });
    }

    // Verify that the state exists if being changed
    if (data.stateId !== existingLGA.stateId) {
      const state = await prisma.state.findUnique({ where: { id: data.stateId } });
      if (!state) {
        return NextResponse.json({ error: 'State not found' }, { status: 404 });
      }
    }

    // Check if another LGA with same name already exists in the target state
    const duplicateLGA = await prisma.lGA.findFirst({
      where: {
        id: { not: id },
        name: { equals: data.name, mode: 'insensitive' },
        stateId: data.stateId,
      },
    });

    if (duplicateLGA) {
      return NextResponse.json(
        { error: 'Another LGA with this name already exists in this state' },
        { status: 409 }
      );
    }

    // Update LGA
    const lga = await prisma.lGA.update({
      where: { id },
      data: {
        name: data.name,
        stateId: data.stateId,
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_LGA',
        entityType: 'LGA',
        entityId: lga.id,
        oldValues: {
          name: existingLGA.name,
          stateId: existingLGA.stateId,
          stateName: existingLGA.state.name,
        },
        newValues: {
          name: lga.name,
          stateId: lga.stateId,
          stateName: lga.state.name,
        },
      },
    });

    return NextResponse.json({
      id: lga.id,
      name: lga.name,
      stateId: lga.stateId,
      state: lga.state,
      assetCount: lga._count.assets,
      createdAt: lga.createdAt.toISOString(),
      updatedAt: lga.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating LGA:', error);
    return NextResponse.json(
      { error: 'Failed to update LGA' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an LGA
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has super admin privileges
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Only super admins can delete LGAs' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'LGA ID is required' }, { status: 400 });
    }

    const lgaId = parseInt(id);
    if (isNaN(lgaId)) {
      return NextResponse.json({ error: 'Invalid LGA ID' }, { status: 400 });
    }

    // Check if LGA exists
    const lga = await prisma.lGA.findUnique({
      where: { id: lgaId },
      include: {
        state: true,
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!lga) {
      return NextResponse.json({ error: 'LGA not found' }, { status: 404 });
    }

    // Check if LGA has associated assets
    if (lga._count.assets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete LGA with associated assets' },
        { status: 400 }
      );
    }

    // Delete the LGA
    await prisma.lGA.delete({ where: { id: lgaId } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_LGA',
        entityType: 'LGA',
        entityId: lgaId,
        oldValues: {
          name: lga.name,
          stateId: lga.stateId,
          stateName: lga.state.name,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting LGA:', error);
    return NextResponse.json(
      { error: 'Failed to delete LGA' },
      { status: 500 }
    );
  }
}
