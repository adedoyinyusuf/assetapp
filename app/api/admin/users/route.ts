import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';


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

// Create a new user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const createUserSchema = z.object({
      firstName: z.string().min(2, 'First name is required'),
      lastName: z.string().min(2, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      roleId: z.number().int().positive('Role is required'),
      isActive: z.boolean().default(true),
      password: z.string().min(6).optional(), // Optional, default will be generated or set
    });

    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, roleId, isActive, password } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Verify role exists
    const role = await prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Hash password (default to 'Password@123' if not provided)
    const { hash } = await import('bcryptjs');
    const initialPassword = password || 'Password@123';
    const hashedPassword = await hash(initialPassword, 12);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        roleId,
        isActive,
        hashedPassword,
      },
      include: {
        role: true,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id, 10),
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: newUser.id,
        newValues: {
          firstName,
          lastName,
          email,
          role: role.name,
          isActive,
        },
      },
    });

    return NextResponse.json({
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role.name,
      isActive: newUser.isActive,
      message: 'User created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Get users with optional role filtering, search, and pagination
export async function GET(req: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    console.log('Session in users API:', JSON.stringify(session, null, 2));

    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'No session found. Please log in.' },
        { status: 401 }
      );
    }

    // if (![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)) {
    //   console.log('Insufficient permissions. User role:', session.user.role, 'Required roles:', [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
    //   return NextResponse.json(
    //     { error: 'Unauthorized. Required role: SUPER_ADMIN, ADMIN, or MANAGER. Current role: ' + session?.user?.role },
    //     { status: 401 }
    //   );
    // }

    const fs = require('fs');
    fs.appendFileSync('admin-users-debug.log', `[${new Date().toISOString()}] Access granted for user: ${session.user.email} with role: ${session.user.role}\n`);

    console.log('Authorization successful for user:', session.user.email, 'with role:', session.user.role);

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
      // Temporarily show all users including inactive ones for debugging
      // isActive: true, 
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
      success: true,
      data: users.map((user: any) => ({
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

// Update user details (role, status, info)
export async function PATCH(req: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();

    // Schema for updating user
    const updateUserSchema = z.object({
      userId: z.number().int().positive(),
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      email: z.string().email().optional(),
      roleId: z.number().int().positive().optional(),
      isActive: z.boolean().optional(),
    });

    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { userId, firstName, lastName, email, roleId, isActive } = validation.data;

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

    const updateData: any = {
      updatedAt: new Date(),
    };
    const logChanges: any = {
      oldValues: {},
      newValues: {}
    };

    if (firstName && firstName !== existingUser.firstName) {
      updateData.firstName = firstName;
      logChanges.oldValues.firstName = existingUser.firstName;
      logChanges.newValues.firstName = firstName;
    }

    if (lastName && lastName !== existingUser.lastName) {
      updateData.lastName = lastName;
      logChanges.oldValues.lastName = existingUser.lastName;
      logChanges.newValues.lastName = lastName;
    }

    if (email && email !== existingUser.email) {
      // Check if email is taken
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken && emailTaken.id !== userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      updateData.email = email;
      logChanges.oldValues.email = existingUser.email;
      logChanges.newValues.email = email;
    }

    if (isActive !== undefined && isActive !== existingUser.isActive) {
      updateData.isActive = isActive;
      logChanges.oldValues.isActive = existingUser.isActive;
      logChanges.newValues.isActive = isActive;
    }

    // Handle role update if provided
    if (roleId && roleId !== existingUser.roleId) {
      const role = await prisma.userRole.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }

      updateData.roleId = roleId;
      logChanges.oldValues.roleId = existingUser.roleId;
      logChanges.newValues.roleId = roleId;
      logChanges.newValues.roleName = role.name;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length <= 1) { // updatedAt is always there
      return NextResponse.json({ message: 'No changes detected' });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
    if (Object.keys(logChanges.newValues).length > 0) {
      await prisma.auditLog.create({
        data: {
          userId: parseInt(session.user.id, 10),
          action: 'UPDATE_USER',
          entityType: 'User',
          entityId: user.id,
          oldValues: logChanges.oldValues,
          newValues: logChanges.newValues,
        },
      });
    }

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
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update user', details: errorMessage },
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
    if (user.role?.name === UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Cannot delete super admin user' }, { status: 403 })
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
