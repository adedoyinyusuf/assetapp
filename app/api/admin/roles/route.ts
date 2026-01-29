import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';


// Input validation schemas
const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.number().int().positive()).optional().default([]),
});

// Get all roles with user counts and permissions
export async function GET() {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch roles with user counts and permissions
    const roles = await prisma.userRole.findMany({
      include: {
        _count: {
          select: { users: true },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format the response
    const formattedRoles = roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissions: role.permissions.map((p: any) => ({
        id: p.permission.id,
        name: p.permission.name,
        description: p.permission.description,
        resource: p.permission.resource,
        action: p.permission.action,
      })),
    }));

    return NextResponse.json(formattedRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// Create a new role
export async function POST(req: Request) {
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
    const validation = roleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, description, permissions } = validation.data;

    // Check if role already exists
    const existingRole = await prisma.userRole.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 409 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the role
      const role = await tx.userRole.create({
        data: {
          name,
          description,
        },
      });

      // Add permissions if provided
      if (permissions && permissions.length > 0) {
        // Verify all permissions exist
        const existingPermissions = await tx.permission.findMany({
          where: { id: { in: permissions } },
        });

        if (existingPermissions.length !== permissions.length) {
          throw new Error('One or more permissions do not exist');
        }

        await tx.rolePermission.createMany({
          data: permissions.map((permissionId: number) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      // Fetch the created role with permissions
      return tx.userRole.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id, 10) as number,
        action: 'CREATE_ROLE',
        entityType: 'Role',
        entityId: result?.id,
        newValues: { name, description },
      },
    });

    return NextResponse.json(
      {
        id: result?.id,
        name: result?.name,
        description: result?.description,
        permissions: result?.permissions.map((p: any) => ({
          id: p.permission.id,
          name: p.permission.name,
          resource: p.permission.resource,
          action: p.permission.action,
        })),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create role', details: errorMessage },
      { status: 500 }
    );
  }
}

// Update a role
export async function PUT(req: Request) {
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
    const validation = roleSchema.extend({
      id: z.number().int().positive(),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, name, description, permissions } = validation.data;

    // Check if role exists
    const existingRole = await prisma.userRole.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if another role with the same name exists
    const duplicateRole = await prisma.userRole.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });

    if (duplicateRole) {
      return NextResponse.json(
        { error: 'Another role with this name already exists' },
        { status: 409 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update the role
      const role = await tx.userRole.update({
        where: { id },
        data: {
          name,
          description,
          updatedAt: new Date(),
        },
      });

      // Update permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Add new permissions if provided
      if (permissions && permissions.length > 0) {
        // Verify all permissions exist
        const existingPermissions = await tx.permission.findMany({
          where: { id: { in: permissions } },
        });

        if (existingPermissions.length !== permissions.length) {
          throw new Error('One or more permissions do not exist');
        }

        await tx.rolePermission.createMany({
          data: permissions.map((permissionId: number) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      // Fetch the updated role with permissions
      return tx.userRole.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });
    });

    // Log the action
    if (result?.id) {
      await prisma.auditLog.create({
        data: {
          userId: parseInt(session.user.id, 10),
          action: 'UPDATE_ROLE',
          entityType: 'Role',
          entityId: result.id,
          newValues: { name, description },
        },
      });
    }

    return NextResponse.json(
      {
        id: result?.id,
        name: result?.name,
        description: result?.description,
        permissions: result?.permissions.map((p: any) => ({
          id: p.permission.id,
          name: p.permission.name,
          resource: p.permission.resource,
          action: p.permission.action,
        })),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error updating role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update role', details: errorMessage },
      { status: 500 }
    );
  }
}

// Delete a role
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

    // Get role ID from query params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role is a system role (prevent deletion of system roles)
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role.name as UserRole) || role.name === 'USER') {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      );
    }

    // Check if role is being used by any users
    const usersWithRole = await prisma.user.count({
      where: { roleId },
    });

    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      );
    }

    // Start a transaction
    await prisma.$transaction([
      // First delete role permissions
      prisma.rolePermission.deleteMany({
        where: { roleId },
      }),
      // Then delete the role
      prisma.userRole.delete({
        where: { id: roleId },
      }),
    ]);

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id, 10),
        action: 'DELETE_ROLE',
        entityType: 'Role',
        entityId: roleId,
        oldValues: { name: role.name },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error('Error deleting role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete role', details: errorMessage },
      { status: 500 }
    );
  }
}
