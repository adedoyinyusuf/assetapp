import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options-simple';
import { z } from 'zod';

// Input validation schemas
const stateUpdateSchema = z.object({
  name: z.string().min(1, 'State name is required'),
  code: z.string().min(2, 'State code must be at least 2 characters').max(10, 'State code too long'),
});

interface RouteParams {
  params: {
    stateId: string;
  };
}

// GET - Retrieve a specific state by ID
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.stateId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    const state = await prisma.state.findUnique({
      where: { id },
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
    console.error('Error fetching state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing state
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

    const id = parseInt(params.stateId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    const body = await req.json();
    const validation = stateUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, code } = validation.data;

    // Check if state exists
    const existingState = await prisma.state.findUnique({ where: { id } });
    if (!existingState) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if another state with same name or code already exists (excluding current)
    const duplicateState = await prisma.state.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { code: { equals: code, mode: 'insensitive' } },
        ],
        id: { not: id },
      },
    });

    if (duplicateState) {
      if (duplicateState.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          { error: 'A state with this name already exists' },
          { status: 409 }
        );
      }
      if (duplicateState.code.toLowerCase() === code.toLowerCase()) {
        return NextResponse.json(
          { error: 'A state with this code already exists' },
          { status: 409 }
        );
      }
    }

    // Update state
    const updatedState = await prisma.state.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
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
        entityId: updatedState.id,
        oldValues: {
          name: existingState.name,
          code: existingState.code,
        },
        newValues: {
          name: updatedState.name,
          code: updatedState.code,
        },
      },
    });

    return NextResponse.json({
      id: updatedState.id,
      name: updatedState.name,
      code: updatedState.code,
      assetCount: updatedState._count.assets,
      lgaCount: updatedState._count.lgas,
      createdAt: updatedState.createdAt.toISOString(),
      updatedAt: updatedState.updatedAt.toISOString(),
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

    const id = parseInt(params.stateId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    // Check if state exists
    const state = await prisma.state.findUnique({
      where: { id },
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

    // Check if any assets are using this state
    if (state._count.assets > 0) {
      return NextResponse.json(
        { error: `Cannot delete state: ${state._count.assets} assets are still assigned to this state` },
        { status: 409 }
      );
    }

    // Check if any LGAs exist in this state
    if (state._count.lgas > 0) {
      return NextResponse.json(
        { error: `Cannot delete state: ${state._count.lgas} LGAs exist in this state. Delete all LGAs first.` },
        { status: 409 }
      );
    }

    // Delete the state
    await prisma.state.delete({ where: { id } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_STATE',
        entityType: 'State',
        entityId: id,
        oldValues: {
          name: state.name,
          code: state.code,
        },
      },
    });

    return NextResponse.json({ message: 'State deleted successfully' });
  } catch (error) {
    console.error('Error deleting state:', error);
    return NextResponse.json(
      { error: 'Failed to delete state' },
      { status: 500 }
    );
  }
}
