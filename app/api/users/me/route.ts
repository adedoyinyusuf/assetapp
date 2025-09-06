// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/server-prisma";
import { getPermissionsForRole, UserRole } from "@/lib/auth/roles";
import type { Permission } from "@/types/permissions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: {
        id: true,
        email: true,
        role: {
          select: {
            name: true,
            id: true
          }
        },
        firstName: true,
        lastName: true,
        isActive: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get the role name and ensure it's a valid UserRole
    const roleName = user.role?.name;
    const validRole = roleName && Object.values(UserRole).includes(roleName as UserRole)
      ? roleName as UserRole
      : UserRole.VIEWER;

    // Get permissions for the user's role
    const permissions: Permission[] = getPermissionsForRole(validRole);

    return NextResponse.json({
      ...user,
      permissions: permissions.map((p) => p.name)
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
