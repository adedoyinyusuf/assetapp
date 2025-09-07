import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options-simple';
import { z } from 'zod';

// Input validation schema
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
});

// GET - Retrieve a single category by ID
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Fetch category with asset count
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
        assets: {
          select: {
            id: true,
            name: true,
            purchaseValue: true,
            currentValue: true,
          },
          take: 10, // Only get first 10 assets for preview
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Calculate total values
    const totalPurchaseValue = category.assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
    const totalCurrentValue = category.assets.reduce((sum, asset) => sum + asset.currentValue, 0);

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      assetCount: category._count.assets,
      totalPurchaseValue,
      totalCurrentValue,
      assets: category.assets,
      createdAt: category.created_at.toISOString(),
      updatedAt: category.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific category
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const body = await req.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if another category with same name already exists
    if (data.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          id: { not: categoryId },
          name: { equals: data.name, mode: 'insensitive' },
        },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Another category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
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
        action: 'UPDATE_CATEGORY',
        entityType: 'Category',
        entityId: category.id,
        oldValues: {
          name: existingCategory.name,
          description: existingCategory.description,
        },
        newValues: {
          name: category.name,
          description: category.description,
        },
      },
    });

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      assetCount: category._count.assets,
      createdAt: category.created_at.toISOString(),
      updatedAt: category.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific category
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has super admin privileges
    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only super admins can delete categories' }, { status: 403 });
    }

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category has associated assets
    if (category._count.assets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated assets' },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({ where: { id: categoryId } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_CATEGORY',
        entityType: 'Category',
        entityId: categoryId,
        oldValues: {
          name: category.name,
          description: category.description,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
