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

        // Fetch latest verification for this asset
        const latestVerification = await db.assetVerification.findFirst({
            where: {
                assetId: assetId,
            },
            select: {
                status: true,
                physicalCondition: true,
                verificationDate: true,
            },
            orderBy: {
                verificationDate: 'desc',
            },
        });

        if (!latestVerification) {
            return NextResponse.json({
                success: true,
                data: null,
            });
        }

        // Calculate days ago
        const verificationDate = new Date(latestVerification.verificationDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - verificationDate.getTime());
        const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return NextResponse.json({
            success: true,
            data: {
                ...latestVerification,
                daysAgo,
            },
        });
    } catch (error) {
        console.error('Error fetching verification status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch verification status' },
            { status: 500 }
        );
    }
}
