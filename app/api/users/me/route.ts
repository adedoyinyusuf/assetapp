import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        permissions: {
          select: {
            permission: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Flatten the permissions array
    const userWithPermissions = {
      ...user,
      permissions: user.permissions.map((p) => p.permission.name),
    };

    return NextResponse.json(userWithPermissions);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const { currentPassword, newPassword, ...updateData } = data;

    // If changing password, verify the current password
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user?.password) {
        return new NextResponse('User not found', { status: 404 });
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return new NextResponse('Current password is incorrect', { status: 400 });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
