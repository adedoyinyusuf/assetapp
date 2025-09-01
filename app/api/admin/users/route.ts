import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

// Input validation schemas
const updateUserRoleSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
});

const userQuerySchema = z.object({
  role: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  search: z.string().optional(),
});

// Get users with optional role filtering, search, and pagination
export async function GET(req: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const validation = userQuerySchema.safeParse(query);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { role, page = 1, limit = 10, search } = validation.data;
    const skip = (page - 1) * limit;

    // Build the where clause with filters
    const whereClause: any = {
      isActive: true, // Only show active users by default
    };

    if (role) {
      whereClause.role = { name: role };
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name || 'USER',
        roleId: user.role?.id || null,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        permissions: user.role?.permissions?.map((rp: any) => rp.permission.name) || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch users', details: errorMessage },
      { status: 500 }
    );
  }
}

// Update user role
export async function PATCH(req: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = updateUserRoleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { userId, roleId } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the role exists
    const role = await prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Update user role
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: roleId,
        updatedAt: new Date(),
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id, 10),
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: user.id,
        oldValues: {
          roleId: existingUser.roleId,
        },
        newValues: {
          roleId: roleId,
          role: role.name,
        },
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role?.name || 'USER',
      roleId: user.role?.id || null,
      isActive: user.isActive,
      permissions: user.role?.permissions?.map((rp: any) => rp.permission.name) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error: unknown) {
    console.error('Error updating user role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update user role', details: errorMessage },
      { status: 500 }
    );
  }
}

// Delete a user (soft delete)
export async function DELETE(req: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from query params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting own account
    if (user.id === parseInt(session.user.id, 10)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deleting super admin accounts
    if (user.role?.name === 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete super admin accounts' },
        { status: 403 }
      );
    }

    // Soft delete the user by setting isActive to false
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id, 10),
        action: 'DELETE_USER',
        entityType: 'User',
        entityId: user.id,
        oldValues: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: true,
          roleId: user.roleId,
          role: user.role?.name || 'USER',
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete user', details: errorMessage },
      { status: 500 }
    );
  }
}
