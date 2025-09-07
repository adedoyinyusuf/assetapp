import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

// Input validation schemas
const updateAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  purchaseValue: z.number().positive('Purchase value must be positive').optional(),
  purchaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  usefulLife: z.number().int().positive('Useful life must be a positive integer').optional(),
  salvageValue: z.number().min(0, 'Salvage value must be non-negative').optional(),
  currentValue: z.number().min(0, 'Current value must be non-negative').optional(),
  categoryId: z.number().int().positive('Category ID is required').optional(),
  stateId: z.number().int().positive('State ID is required').optional(),
  lgaId: z.number().int().positive('LGA ID is required').optional(),
});

// Helper function to calculate current value based on depreciation
function calculateCurrentValue(asset: {
  purchaseDate: Date | string;
  purchaseValue: number;
  salvageValue: number;
  usefulLife: number;
}) {
  const purchaseDate = new Date(asset.purchaseDate);
  const now = new Date();
  const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (asset.usefulLife <= 0) return asset.salvageValue;
  
  const annualDepreciation = (asset.purchaseValue - asset.salvageValue) / asset.usefulLife;
  const totalDepreciation = Math.min(
    annualDepreciation * yearsElapsed,
    asset.purchaseValue - asset.salvageValue
  );
  
  return Math.max(
    asset.purchaseValue - totalDepreciation,
    asset.salvageValue
  );
}

// GET - Retrieve a single asset by ID
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assetId = parseInt(params.id);
    if (isNaN(assetId)) {
      return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
    }

    // Fetch asset with all related data
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        state: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lga: {
          select: {
            id: true,
            name: true,
            stateId: true,
          },
        },
        movements: {
          select: {
            id: true,
            movementDate: true,
            reason: true,
            movedBy: true,
            fromState: {
              select: {
                id: true,
                name: true,
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
          take: 10, // Only get recent movements
        },
        depreciation: {
          select: {
            id: true,
            year: true,
            depreciation: true,
            currentValue: true,
          },
          orderBy: {
            year: 'desc',
          },
          take: 5, // Only get recent depreciation records
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Calculate current depreciation value
    const calculatedCurrentValue = calculateCurrentValue(asset);

    // Format the response
    return NextResponse.json({
      id: asset.id,
      name: asset.name,
      description: asset.description,
      purchaseValue: asset.purchaseValue,
      purchaseDate: asset.purchaseDate.toISOString(),
      usefulLife: asset.usefulLife,
      salvageValue: asset.salvageValue,
      currentValue: asset.currentValue,
      calculatedCurrentValue,
      category: asset.category,
      state: asset.state,
      lga: asset.lga,
      movements: asset.movements.map(movement => ({
        id: movement.id,
        movementDate: movement.movementDate.toISOString(),
        reason: movement.reason,
        movedBy: movement.movedBy,
        from: {
          state: movement.fromState,
          lga: movement.fromLga,
        },
        to: {
          state: movement.toState,
          lga: movement.toLga,
        },
      })),
      depreciation: asset.depreciation.map(dep => ({
        id: dep.id,
        year: dep.year,
        depreciation: dep.depreciation,
        currentValue: dep.currentValue,
      })),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific asset
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assetId = parseInt(params.id);
    if (isNaN(assetId)) {
      return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
    }

    const body = await req.json();
    const validation = updateAssetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Verify category, state, and LGA exist if provided
    if (data.categoryId || data.stateId || data.lgaId) {
      const [category, state, lga] = await Promise.all([
        data.categoryId ? prisma.category.findUnique({ where: { id: data.categoryId } }) : null,
        data.stateId ? prisma.state.findUnique({ where: { id: data.stateId } }) : null,
        data.lgaId ? prisma.lGA.findUnique({ where: { id: data.lgaId } }) : null,
      ]);

      if (data.categoryId && !category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      if (data.stateId && !state) {
        return NextResponse.json({ error: 'State not found' }, { status: 404 });
      }
      if (data.lgaId && !lga) {
        return NextResponse.json({ error: 'LGA not found' }, { status: 404 });
      }
      if (data.lgaId && data.stateId && lga && lga.stateId !== data.stateId) {
        return NextResponse.json({ error: 'LGA does not belong to the specified state' }, { status: 400 });
      }
    }

    // Calculate current value if depreciation-affecting fields are updated
    let currentValue = data.currentValue;
    if (!currentValue && (data.purchaseDate || data.purchaseValue || data.salvageValue || data.usefulLife)) {
      currentValue = calculateCurrentValue({
        purchaseDate: data.purchaseDate || existingAsset.purchaseDate,
        purchaseValue: data.purchaseValue || existingAsset.purchaseValue,
        salvageValue: data.salvageValue !== undefined ? data.salvageValue : existingAsset.salvageValue,
        usefulLife: data.usefulLife || existingAsset.usefulLife,
      });
    }

    // Update asset
    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        ...data,
        ...(data.purchaseDate && { purchaseDate: new Date(data.purchaseDate) }),
        ...(currentValue !== undefined && { currentValue }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        state: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lga: {
          select: {
            id: true,
            name: true,
            stateId: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_ASSET',
        entityType: 'Asset',
        entityId: asset.id,
        oldValues: {
          name: existingAsset.name,
          categoryId: existingAsset.categoryId,
          purchaseValue: existingAsset.purchaseValue,
        },
        newValues: {
          name: asset.name,
          categoryId: asset.categoryId,
          purchaseValue: asset.purchaseValue,
        },
      },
    });

    return NextResponse.json({
      id: asset.id,
      name: asset.name,
      description: asset.description,
      purchaseValue: asset.purchaseValue,
      purchaseDate: asset.purchaseDate.toISOString(),
      usefulLife: asset.usefulLife,
      salvageValue: asset.salvageValue,
      currentValue: asset.currentValue,
      category: asset.category,
      state: asset.state,
      lga: asset.lga,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific asset
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has sufficient permissions
    if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const assetId = parseInt(params.id);
    if (isNaN(assetId)) {
      return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Delete related records in a transaction
    await prisma.$transaction([
      // Delete depreciation records
      prisma.depreciation.deleteMany({ where: { assetId } }),
      // Delete movement records
      prisma.assetMovement.deleteMany({ where: { assetId } }),
      // Delete the asset
      prisma.asset.delete({ where: { id: assetId } }),
    ]);

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_ASSET',
        entityType: 'Asset',
        entityId: assetId,
        oldValues: {
          name: asset.name,
          categoryId: asset.categoryId,
          purchaseValue: asset.purchaseValue,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
