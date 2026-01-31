import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Prisma query to get states with counts
    // Note: Prisma relationship counting is cleaner
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            lgas: true,
            assets: true,
          },
        },
      },
    });

    const formattedStates = states.map((state) => ({
      id: state.id,
      name: state.name,
      code: state.code,
      lgaCount: state._count.lgas,
      assetCount: state._count.assets,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    }));

    return NextResponse.json(formattedStates);
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
