import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';


// Input validation schemas
const depreciationSchema = z.object({
  assetId: z.number().int().positive('Asset ID is required'),
  year: z.number().int().min(2000).max(2100, 'Year must be between 2000 and 2100'),
  depreciation: z.number().min(0, 'Depreciation must be non-negative'),
  currentValue: z.number().min(0, 'Current value must be non-negative'),
});

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  assetId: z.string().regex(/^\d+$/).transform(Number).optional(),
  year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  minYear: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  maxYear: z.string().regex(/^\d{4}$/).transform(Number).optional(),
});

// Helper function to calculate depreciation for an asset
function calculateDepreciation(asset: {
  purchaseDate: Date;
  purchaseValue: number;
  salvageValue: number;
  usefulLife: number;
}, targetYear: number) {
  const purchaseYear = asset.purchaseDate.getFullYear();
  const yearsElapsed = Math.max(0, targetYear - purchaseYear);

  if (asset.usefulLife <= 0) {
    return {
      depreciation: 0,
      currentValue: asset.salvageValue,
    };
  }

  const annualDepreciation = (asset.purchaseValue - asset.salvageValue) / asset.usefulLife;
  const totalDepreciation = Math.min(
    annualDepreciation * yearsElapsed,
    asset.purchaseValue - asset.salvageValue
  );

  const currentValue = Math.max(
    asset.purchaseValue - totalDepreciation,
    asset.salvageValue
  );

  return {
    depreciation: yearsElapsed <= asset.usefulLife ? annualDepreciation : 0,
    currentValue,
  };
}

// GET - Retrieve depreciation records with filtering and pagination
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

    const { page, limit, assetId, year, minYear, maxYear } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (assetId) {
      whereClause.assetId = assetId;
    }

    if (year) {
      whereClause.year = year;
    } else {
      if (minYear !== undefined || maxYear !== undefined) {
        whereClause.year = {};
        if (minYear !== undefined) whereClause.year.gte = minYear;
        if (maxYear !== undefined) whereClause.year.lte = maxYear;
      }
    }

    // Fetch depreciation records and total count
    const [depreciations, total] = await Promise.all([
      prisma.depreciation.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              description: true,
              purchaseValue: true,
              purchaseDate: true,
              usefulLife: true,
              salvageValue: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { year: 'desc' },
          { asset: { name: 'asc' } },
        ],
      }),
      prisma.depreciation.count({ where: whereClause }),
    ]);

    // Format depreciation records
    const formattedDepreciations = depreciations.map((dep: any) => ({
      id: dep.id,
      assetId: dep.assetId,
      asset: dep.asset,
      year: dep.year,
      depreciation: dep.depreciation,
      currentValue: dep.currentValue,
      depreciationPercentage: dep.asset.purchaseValue > 0
        ? ((dep.asset.purchaseValue - dep.currentValue) / dep.asset.purchaseValue) * 100
        : 0,
      createdAt: dep.createdAt.toISOString(),
      updatedAt: dep.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: formattedDepreciations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching depreciation records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch depreciation records' },
      { status: 500 }
    );
  }
}

// POST - Create depreciation records (can be individual or bulk)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Handle both single record and bulk operations
    const isBulk = body.type === 'bulk';

    if (isBulk) {
      // Bulk depreciation calculation for a specific year
      const bulkSchema = z.object({
        type: z.literal('bulk'),
        year: z.number().int().min(2000).max(2100),
        assetIds: z.array(z.number().int().positive()).optional(),
      });

      const validation = bulkSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.issues },
          { status: 400 }
        );
      }

      const { year, assetIds } = validation.data;

      // Get assets to calculate depreciation for
      const whereClause = assetIds ? { id: { in: assetIds } } : {};
      const assets = await prisma.asset.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          purchaseDate: true,
          purchaseValue: true,
          salvageValue: true,
          usefulLife: true,
        },
      });

      if (assets.length === 0) {
        return NextResponse.json({ error: 'No assets found' }, { status: 404 });
      }

      // Calculate and create depreciation records
      const depreciationRecords = [];
      const createdRecords = [];

      for (const asset of assets) {
        // Check if record already exists
        const existing = await prisma.depreciation.findUnique({
          where: {
            assetId_year: {
              assetId: asset.id,
              year,
            },
          },
        });

        if (existing) {
          continue; // Skip if already exists
        }

        const { depreciation, currentValue } = calculateDepreciation(asset, year);

        depreciationRecords.push({
          assetId: asset.id,
          year,
          depreciation,
          currentValue,
        });
      }

      if (depreciationRecords.length > 0) {
        await prisma.depreciation.createMany({
          data: depreciationRecords,
        });

        // Get the created records with asset details
        const created = await prisma.depreciation.findMany({
          where: {
            assetId: { in: depreciationRecords.map((r: any) => r.assetId) },
            year,
          },
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                description: true,
                purchaseValue: true,
              },
            },
          },
        });

        createdRecords.push(...created);
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: parseInt(session.user.id),
          action: 'BULK_CREATE_DEPRECIATION',
          entityType: 'Depreciation',
          newValues: {
            year,
            recordsCreated: createdRecords.length,
            totalAssets: assets.length,
          },
        },
      });

      return NextResponse.json({
        message: `Created ${createdRecords.length} depreciation records for year ${year}`,
        year,
        recordsCreated: createdRecords.length,
        records: createdRecords.map((r: any) => ({
          id: r.id,
          assetId: r.assetId,
          asset: r.asset,
          year: r.year,
          depreciation: r.depreciation,
          currentValue: r.currentValue,
          createdAt: r.createdAt.toISOString(),
        })),
      }, { status: 201 });

    } else {
      // Single depreciation record
      const validation = depreciationSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.issues },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Verify asset exists
      const asset = await prisma.asset.findUnique({
        where: { id: data.assetId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      // Check if record already exists
      const existing = await prisma.depreciation.findUnique({
        where: {
          assetId_year: {
            assetId: data.assetId,
            year: data.year,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Depreciation record for this asset and year already exists' },
          { status: 409 }
        );
      }

      // Create depreciation record
      const depreciation = await prisma.depreciation.create({
        data: {
          assetId: data.assetId,
          year: data.year,
          depreciation: data.depreciation,
          currentValue: data.currentValue,
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              description: true,
              purchaseValue: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update asset's current value
      await prisma.asset.update({
        where: { id: data.assetId },
        data: { currentValue: data.currentValue },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: parseInt(session.user.id),
          action: 'CREATE_DEPRECIATION',
          entityType: 'Depreciation',
          entityId: depreciation.id,
          newValues: {
            assetId: depreciation.assetId,
            assetName: depreciation.asset.name,
            year: depreciation.year,
            depreciation: depreciation.depreciation,
            currentValue: depreciation.currentValue,
          },
        },
      });

      return NextResponse.json({
        id: depreciation.id,
        assetId: depreciation.assetId,
        asset: depreciation.asset,
        year: depreciation.year,
        depreciation: depreciation.depreciation,
        currentValue: depreciation.currentValue,
        depreciationPercentage: asset.purchaseValue > 0
          ? ((asset.purchaseValue - depreciation.currentValue) / asset.purchaseValue) * 100
          : 0,
        createdAt: depreciation.createdAt.toISOString(),
        updatedAt: depreciation.updatedAt.toISOString(),
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating depreciation record:', error);
    return NextResponse.json(
      { error: 'Failed to create depreciation record' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing depreciation record
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to update depreciation
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const validation = depreciationSchema.extend({
      id: z.number().int().positive(),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    // Check if depreciation record exists
    const existing = await prisma.depreciation.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Depreciation record not found' }, { status: 404 });
    }

    // Verify asset exists if changing
    if (data.assetId !== existing.assetId) {
      const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
    }

    // Check for duplicate if changing asset or year
    if (data.assetId !== existing.assetId || data.year !== existing.year) {
      const duplicate = await prisma.depreciation.findFirst({
        where: {
          id: { not: id },
          assetId: data.assetId,
          year: data.year,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Depreciation record for this asset and year already exists' },
          { status: 409 }
        );
      }
    }

    // Update depreciation record
    const depreciation = await prisma.depreciation.update({
      where: { id },
      data: {
        assetId: data.assetId,
        year: data.year,
        depreciation: data.depreciation,
        currentValue: data.currentValue,
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            description: true,
            purchaseValue: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update asset's current value
    await prisma.asset.update({
      where: { id: data.assetId },
      data: { currentValue: data.currentValue },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_DEPRECIATION',
        entityType: 'Depreciation',
        entityId: depreciation.id,
        oldValues: {
          assetId: existing.assetId,
          year: existing.year,
          depreciation: existing.depreciation,
          currentValue: existing.currentValue,
        },
        newValues: {
          assetId: depreciation.assetId,
          year: depreciation.year,
          depreciation: depreciation.depreciation,
          currentValue: depreciation.currentValue,
        },
      },
    });

    return NextResponse.json({
      id: depreciation.id,
      assetId: depreciation.assetId,
      asset: depreciation.asset,
      year: depreciation.year,
      depreciation: depreciation.depreciation,
      currentValue: depreciation.currentValue,
      depreciationPercentage: depreciation.asset.purchaseValue > 0
        ? ((depreciation.asset.purchaseValue - depreciation.currentValue) / depreciation.asset.purchaseValue) * 100
        : 0,
      createdAt: depreciation.createdAt.toISOString(),
      updatedAt: depreciation.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating depreciation record:', error);
    return NextResponse.json(
      { error: 'Failed to update depreciation record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a depreciation record
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow super admin to delete depreciation records
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Only super admins can delete depreciation records' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Depreciation ID is required' }, { status: 400 });
    }

    const depreciationId = parseInt(id);
    if (isNaN(depreciationId)) {
      return NextResponse.json({ error: 'Invalid depreciation ID' }, { status: 400 });
    }

    // Check if depreciation record exists
    const depreciation = await prisma.depreciation.findUnique({
      where: { id: depreciationId },
      include: { asset: true },
    });

    if (!depreciation) {
      return NextResponse.json({ error: 'Depreciation record not found' }, { status: 404 });
    }

    // Delete the depreciation record
    await prisma.depreciation.delete({ where: { id: depreciationId } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_DEPRECIATION',
        entityType: 'Depreciation',
        entityId: depreciationId,
        oldValues: {
          assetId: depreciation.assetId,
          assetName: depreciation.asset.name,
          year: depreciation.year,
          depreciation: depreciation.depreciation,
          currentValue: depreciation.currentValue,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting depreciation record:', error);
    return NextResponse.json(
      { error: 'Failed to delete depreciation record' },
      { status: 500 }
    );
  }
}
