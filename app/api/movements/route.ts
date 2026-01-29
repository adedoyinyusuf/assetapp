import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';


// Input validation schemas
const movementSchema = z.object({
  assetId: z.number().int().positive('Asset ID is required'),
  fromStateId: z.number().int().positive('From State ID is required'),
  fromLgaId: z.number().int().positive('From LGA ID is required'),
  toStateId: z.number().int().positive('To State ID is required'),
  toLgaId: z.number().int().positive('To LGA ID is required'),
  movementDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
  movedBy: z.string().min(1, 'Moved by is required'),
});

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  assetId: z.string().regex(/^\d+$/).transform(Number).optional(),
  stateId: z.string().regex(/^\d+$/).transform(Number).optional(),
  lgaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET - Retrieve asset movements with filtering and pagination
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

    const { page, limit, assetId, stateId, lgaId, startDate, endDate } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (assetId) {
      whereClause.assetId = assetId;
    }
    
    if (stateId) {
      whereClause.OR = [
        { fromStateId: stateId },
        { toStateId: stateId },
      ];
    }
    
    if (lgaId) {
      whereClause.OR = [
        { fromLgaId: lgaId },
        { toLgaId: lgaId },
      ];
    }

    if (startDate && endDate) {
      whereClause.movementDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.movementDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.movementDate = {
        lte: new Date(endDate),
      };
    }

    // Fetch movements and total count
    const [movements, total] = await Promise.all([
      prisma.assetMovement.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          fromState: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          fromLga: {
            select: {
              id: true,
              name: true,
            },
          },
          toState: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          toLga: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          movementDate: 'desc',
        },
      }),
      prisma.assetMovement.count({ where: whereClause }),
    ]);

    // Format movements
    const formattedMovements = movements.map((movement) => ({
      id: movement.id,
      assetId: movement.assetId,
      asset: movement.asset,
      from: {
        state: movement.fromState,
        lga: movement.fromLga,
      },
      to: {
        state: movement.toState,
        lga: movement.toLga,
      },
      movementDate: movement.movementDate.toISOString(),
      reason: movement.reason,
      notes: movement.notes,
      movedBy: movement.movedBy,
      createdAt: movement.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data: formattedMovements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching asset movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset movements' },
      { status: 500 }
    );
  }
}

// POST - Create a new asset movement
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = movementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify that all referenced entities exist
    const [asset, fromState, fromLga, toState, toLga] = await Promise.all([
      prisma.asset.findUnique({ where: { id: data.assetId } }),
      prisma.state.findUnique({ where: { id: data.fromStateId } }),
      prisma.lGA.findUnique({ where: { id: data.fromLgaId } }),
      prisma.state.findUnique({ where: { id: data.toStateId } }),
      prisma.lGA.findUnique({ where: { id: data.toLgaId } }),
    ]);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (!fromState) {
      return NextResponse.json({ error: 'From state not found' }, { status: 404 });
    }
    if (!fromLga) {
      return NextResponse.json({ error: 'From LGA not found' }, { status: 404 });
    }
    if (!toState) {
      return NextResponse.json({ error: 'To state not found' }, { status: 404 });
    }
    if (!toLga) {
      return NextResponse.json({ error: 'To LGA not found' }, { status: 404 });
    }

    // Verify LGA-State relationships
    if (fromLga.stateId !== data.fromStateId) {
      return NextResponse.json(
        { error: 'From LGA does not belong to the specified from state' },
        { status: 400 }
      );
    }
    if (toLga.stateId !== data.toStateId) {
      return NextResponse.json(
        { error: 'To LGA does not belong to the specified to state' },
        { status: 400 }
      );
    }

    // Check if this is actually a movement (not same location)
    if (data.fromStateId === data.toStateId && data.fromLgaId === data.toLgaId) {
      return NextResponse.json(
        { error: 'Asset is already at the specified location' },
        { status: 400 }
      );
    }

    // Create movement and update asset location in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the movement record
      const movement = await tx.assetMovement.create({
        data: {
          ...data,
          movementDate: new Date(data.movementDate),
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          fromState: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          fromLga: {
            select: {
              id: true,
              name: true,
            },
          },
          toState: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          toLga: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update the asset's current location
      await tx.asset.update({
        where: { id: data.assetId },
        data: {
          stateId: data.toStateId,
          lgaId: data.toLgaId,
        },
      });

      return movement;
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_ASSET_MOVEMENT',
        entityType: 'AssetMovement',
        entityId: result.id,
        newValues: {
          assetId: result.assetId,
          assetName: result.asset.name,
          from: `${result.fromState.name} - ${result.fromLga.name}`,
          to: `${result.toState.name} - ${result.toLga.name}`,
          reason: result.reason,
          movedBy: result.movedBy,
        },
      },
    });

    return NextResponse.json({
      id: result.id,
      assetId: result.assetId,
      asset: result.asset,
      from: {
        state: result.fromState,
        lga: result.fromLga,
      },
      to: {
        state: result.toState,
        lga: result.toLga,
      },
      movementDate: result.movementDate.toISOString(),
      reason: result.reason,
      notes: result.notes,
      movedBy: result.movedBy,
      createdAt: result.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating asset movement:', error);
    return NextResponse.json(
      { error: 'Failed to create asset movement' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing asset movement
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to update movements
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const validation = movementSchema.extend({
      id: z.number().int().positive(),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    // Check if movement exists
    const existingMovement = await prisma.assetMovement.findUnique({
      where: { id },
      include: {
        asset: true,
        fromState: true,
        fromLga: true,
        toState: true,
        toLga: true,
      },
    });

    if (!existingMovement) {
      return NextResponse.json({ error: 'Asset movement not found' }, { status: 404 });
    }

    // Verify that all referenced entities exist
    const [asset, fromState, fromLga, toState, toLga] = await Promise.all([
      prisma.asset.findUnique({ where: { id: data.assetId } }),
      prisma.state.findUnique({ where: { id: data.fromStateId } }),
      prisma.lGA.findUnique({ where: { id: data.fromLgaId } }),
      prisma.state.findUnique({ where: { id: data.toStateId } }),
      prisma.lGA.findUnique({ where: { id: data.toLgaId } }),
    ]);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (!fromState) {
      return NextResponse.json({ error: 'From state not found' }, { status: 404 });
    }
    if (!fromLga) {
      return NextResponse.json({ error: 'From LGA not found' }, { status: 404 });
    }
    if (!toState) {
      return NextResponse.json({ error: 'To state not found' }, { status: 404 });
    }
    if (!toLga) {
      return NextResponse.json({ error: 'To LGA not found' }, { status: 404 });
    }

    // Verify LGA-State relationships
    if (fromLga.stateId !== data.fromStateId) {
      return NextResponse.json(
        { error: 'From LGA does not belong to the specified from state' },
        { status: 400 }
      );
    }
    if (toLga.stateId !== data.toStateId) {
      return NextResponse.json(
        { error: 'To LGA does not belong to the specified to state' },
        { status: 400 }
      );
    }

    // Update movement
    const movement = await prisma.assetMovement.update({
      where: { id },
      data: {
        ...data,
        movementDate: new Date(data.movementDate),
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        fromState: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        fromLga: {
          select: {
            id: true,
            name: true,
          },
        },
        toState: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        toLga: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_ASSET_MOVEMENT',
        entityType: 'AssetMovement',
        entityId: movement.id,
        oldValues: {
          assetId: existingMovement.assetId,
          from: `${existingMovement.fromState.name} - ${existingMovement.fromLga.name}`,
          to: `${existingMovement.toState.name} - ${existingMovement.toLga.name}`,
          reason: existingMovement.reason,
        },
        newValues: {
          assetId: movement.assetId,
          from: `${movement.fromState.name} - ${movement.fromLga.name}`,
          to: `${movement.toState.name} - ${movement.toLga.name}`,
          reason: movement.reason,
        },
      },
    });

    return NextResponse.json({
      id: movement.id,
      assetId: movement.assetId,
      asset: movement.asset,
      from: {
        state: movement.fromState,
        lga: movement.fromLga,
      },
      to: {
        state: movement.toState,
        lga: movement.toLga,
      },
      movementDate: movement.movementDate.toISOString(),
      reason: movement.reason,
      notes: movement.notes,
      movedBy: movement.movedBy,
      createdAt: movement.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating asset movement:', error);
    return NextResponse.json(
      { error: 'Failed to update asset movement' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an asset movement
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow super admin to delete movements
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Only super admins can delete asset movements' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Movement ID is required' }, { status: 400 });
    }

    const movementId = parseInt(id);
    if (isNaN(movementId)) {
      return NextResponse.json({ error: 'Invalid movement ID' }, { status: 400 });
    }

    // Check if movement exists
    const movement = await prisma.assetMovement.findUnique({
      where: { id: movementId },
      include: {
        asset: true,
        fromState: true,
        fromLga: true,
        toState: true,
        toLga: true,
      },
    });

    if (!movement) {
      return NextResponse.json({ error: 'Asset movement not found' }, { status: 404 });
    }

    // Delete the movement
    await prisma.assetMovement.delete({ where: { id: movementId } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_ASSET_MOVEMENT',
        entityType: 'AssetMovement',
        entityId: movementId,
        oldValues: {
          assetId: movement.assetId,
          assetName: movement.asset.name,
          from: `${movement.fromState.name} - ${movement.fromLga.name}`,
          to: `${movement.toState.name} - ${movement.toLga.name}`,
          reason: movement.reason,
          movedBy: movement.movedBy,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting asset movement:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset movement' },
      { status: 500 }
    );
  }
}
