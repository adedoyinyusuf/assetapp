import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

interface RouteParams {
  params: {
    stateId: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stateId = parseInt(params.stateId);
    
    if (isNaN(stateId)) {
      return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 });
    }

    // Verify state exists
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Fetch LGAs for this state
    const lgas = await prisma.lGA.findMany({
      where: {
        stateId: stateId,
      },
      select: {
        id: true,
        name: true,
        stateId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format for client consumption
    const formattedLGAs = lgas.map((lga) => ({
      id: lga.id,
      name: lga.name,
      state_id: lga.stateId,
    }));

    return NextResponse.json(formattedLGAs);
  } catch (error) {
    console.error('Error fetching LGAs for state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LGAs' },
      { status: 500 }
    );
  }
}
