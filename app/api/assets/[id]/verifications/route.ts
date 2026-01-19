import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const assetId = parseInt(params.id);

        if (isNaN(assetId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid asset ID' },
                { status: 400 }
            );
        }

        // Fetch verifications for this asset
        const verifications = await db.assetVerification.findMany({
            where: {
                assetId: assetId,
            },
            include: {
                verifier: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                verificationDate: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            data: verifications,
            count: verifications.length,
        });
    } catch (error) {
        console.error('Error fetching asset verifications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch verifications' },
            { status: 500 }
        );
    }
}
