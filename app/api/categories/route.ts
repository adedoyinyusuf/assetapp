import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options-simple';
import { z } from 'zod';

// Input validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const categories = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT id, name, description, created_at, updated_at 
      FROM categories 
      ORDER BY name ASC
    `;
    
    const formattedCategories = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || undefined,
      defaultUsefulLifeYears: 5, // Default value since it's not in the DB schema
      parent_id: undefined,
      created_at: new Date(cat.created_at).toISOString(),
      updated_at: new Date(cat.updated_at).toISOString()
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const userRole = session.user.role as string;
    console.log('User role check - Role:', userRole, 'Type:', typeof userRole);
    
    // Handle different role formats
    const normalizedRole = userRole?.toUpperCase();
    if (normalizedRole !== 'SUPERADMIN' && normalizedRole !== 'SUPER_ADMIN' && normalizedRole !== 'ADMIN') {
      console.log('User role check failed. Normalized role:', normalizedRole);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if category with same name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_CATEGORY',
        entityType: 'Category',
        entityId: category.id,
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
      assetCount: 0,
      createdAt: category.created_at.toISOString(),
      updatedAt: category.updated_at.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
