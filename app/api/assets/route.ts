import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

// Input validation schemas
const assetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  purchaseValue: z.number().positive('Purchase value must be positive'),
  purchaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  usefulLife: z.number().int().positive('Useful life must be a positive integer'),
  salvageValue: z.number().min(0, 'Salvage value must be non-negative').default(0),
  categoryId: z.number().int().positive('Category ID is required'),
  stateId: z.number().int().positive('State ID is required'),
  lgaId: z.number().int().positive('LGA ID is required'),
});

const updateAssetSchema = assetSchema.extend({
  currentValue: z.number().min(0, 'Current value must be non-negative').optional(),
});

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  search: z.string().optional(),
  categoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
  stateId: z.string().regex(/^\d+$/).transform(Number).optional(),
  lgaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  minValue: z.string().regex(/^\d*\.?\d+$/).transform(Number).optional(),
  maxValue: z.string().regex(/^\d*\.?\d+$/).transform(Number).optional(),
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

// GET - Retrieve assets with filtering and pagination
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

    const { page, limit, search, categoryId, stateId, lgaId, minValue, maxValue } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) whereClause.categoryId = categoryId;
    if (stateId) whereClause.stateId = stateId;
    if (lgaId) whereClause.lgaId = lgaId;

    if (minValue !== undefined || maxValue !== undefined) {
      whereClause.purchaseValue = {};
      if (minValue !== undefined) whereClause.purchaseValue.gte = minValue;
      if (maxValue !== undefined) whereClause.purchaseValue.lte = maxValue;
    }

    // Fetch assets and total count
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: whereClause,
        skip,
        take: limit,
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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.asset.count({ where: whereClause }),
    ]);

    // Format assets with calculated current values
    const formattedAssets = assets.map((asset) => {
      const currentValue = calculateCurrentValue(asset);
      
      return {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        purchaseValue: asset.purchaseValue,
        purchaseDate: asset.purchaseDate.toISOString(),
        usefulLife: asset.usefulLife,
        salvageValue: asset.salvageValue,
        currentValue,
        category: asset.category,
        state: asset.state,
        lga: asset.lga,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      data: formattedAssets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// POST - Create a new asset
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = assetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify category, state, and LGA exist
    const [category, state, lga] = await Promise.all([
      prisma.category.findUnique({ where: { id: data.categoryId } }),
      prisma.state.findUnique({ where: { id: data.stateId } }),
      prisma.lGA.findUnique({ where: { id: data.lgaId } }),
    ]);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }
    if (!lga) {
      return NextResponse.json({ error: 'LGA not found' }, { status: 404 });
    }
    if (lga.stateId !== data.stateId) {
      return NextResponse.json({ error: 'LGA does not belong to the specified state' }, { status: 400 });
    }

    // Calculate initial current value
    const currentValue = calculateCurrentValue({
      purchaseDate: data.purchaseDate,
      purchaseValue: data.purchaseValue,
      salvageValue: data.salvageValue,
      usefulLife: data.usefulLife,
    });

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        currentValue,
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
        action: 'CREATE_ASSET',
        entityType: 'Asset',
        entityId: asset.id,
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing asset
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateAssetSchema.extend({
      id: z.number().int().positive(),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({ where: { id } });
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
      where: { id },
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

// DELETE - Delete an asset
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const assetId = parseInt(id);
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
