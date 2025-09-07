import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options-simple';
import { z } from 'zod';

// Input validation schemas
const lgaUpdateSchema = z.object({
  name: z.string().min(1, 'LGA name is required'),
  stateId: z.number().int().positive('State ID is required'),
});

interface RouteParams {
  params: {
    lgaId: string;
  };
}

// GET - Retrieve a specific LGA by ID
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.lgaId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid LGA ID' }, { status: 400 });
    }

    const lga = await prisma.lGA.findUnique({
      where: { id },
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

    if (!lga) {
      return NextResponse.json({ error: 'LGA not found' }, { status: 404 });
    }

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
    console.error('Error fetching LGA:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LGA' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing LGA
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const id = parseInt(params.lgaId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid LGA ID' }, { status: 400 });
    }

    const body = await req.json();
    const validation = lgaUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, stateId } = validation.data;

    // Check if LGA exists
    const existingLGA = await prisma.lGA.findUnique({ where: { id } });
    if (!existingLGA) {
      return NextResponse.json({ error: 'LGA not found' }, { status: 404 });
    }

    // Verify that the state exists
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if LGA with same name already exists in this state (excluding current)
    const duplicateLGA = await prisma.lGA.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        stateId: stateId,
        id: { not: id },
      },
    });

    if (duplicateLGA) {
      return NextResponse.json(
        { error: 'An LGA with this name already exists in this state' },
        { status: 409 }
      );
    }

    // Update LGA
    const updatedLGA = await prisma.lGA.update({
      where: { id },
      data: {
        name,
        stateId,
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
        entityId: updatedLGA.id,
        oldValues: {
          name: existingLGA.name,
          stateId: existingLGA.stateId,
        },
        newValues: {
          name: updatedLGA.name,
          stateId: updatedLGA.stateId,
          stateName: updatedLGA.state.name,
        },
      },
    });

    return NextResponse.json({
      id: updatedLGA.id,
      name: updatedLGA.name,
      stateId: updatedLGA.stateId,
      state: updatedLGA.state,
      assetCount: updatedLGA._count.assets,
      createdAt: updatedLGA.createdAt.toISOString(),
      updatedAt: updatedLGA.updatedAt.toISOString(),
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
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const id = parseInt(params.lgaId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid LGA ID' }, { status: 400 });
    }

    // Check if LGA exists
    const lga = await prisma.lGA.findUnique({
      where: { id },
      include: {
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

    // Check if any assets are using this LGA
    if (lga._count.assets > 0) {
      return NextResponse.json(
        { error: `Cannot delete LGA: ${lga._count.assets} assets are still assigned to this LGA` },
        { status: 409 }
      );
    }

    // Delete the LGA
    await prisma.lGA.delete({ where: { id } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_LGA',
        entityType: 'LGA',
        entityId: id,
        oldValues: {
          name: lga.name,
          stateId: lga.stateId,
        },
      },
    });

    return NextResponse.json({ message: 'LGA deleted successfully' });
  } catch (error) {
    console.error('Error deleting LGA:', error);
    return NextResponse.json(
      { error: 'Failed to delete LGA' },
      { status: 500 }
    );
  }
}
