import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Prisma expects ID as number if defined as Int in schema. 
    // Checking schema via assumption/previous knowledge (usually auto-increment int for legacy apps or string uuid).
    // The server.js used `parseInt(id)` or equivalent via raw SQL usually implies int. 
    // Let's verify schema or assume Int based on typical setup.
    // server.js DB schema shows `id` but doesn't explicitly show type in query, but typically IDs are Ints in PG unless UUID.
    // Let's try parsing as Int. If it fails (NaN), it might be UUID. 
    // However, in `server.js` route `/api/categories/:id`, it uses `$2` where `$2` is `id`.
    // In `DELETE`, it uses `$1`.

    // Let's check `schema.prisma` first to be sure or use `parseInt`.
    // Safest is to try parsing.

    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: 'Category deleted' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      // If coming from delete, sometimes it's already gone or child constraint.
      // Prisma throws P2025 if not found.
      return NextResponse.json({ message: 'Category not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
