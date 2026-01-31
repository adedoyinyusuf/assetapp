import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id: stateId } = params;

        const parsedStateId = parseInt(stateId, 10);
        if (isNaN(parsedStateId)) {
            return NextResponse.json({ error: 'Invalid State ID' }, { status: 400 });
        }

        const lgas = await prisma.lGA.findMany({
            where: { stateId: parsedStateId },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(lgas);
    } catch (error) {
        console.error('Error fetching LGAs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
