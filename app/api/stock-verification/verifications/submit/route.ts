import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { VerificationService } from '@/lib/stock-verification/verification-service';
import { submitVerificationSchema } from '@/lib/stock-verification/validation';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate request
        const validationResult = submitVerificationSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validationResult.error.issues,
                },
                { status: 400 }
            );
        }

        // Initialize service
        const verificationService = new VerificationService();
        const userId = parseInt(String(session.user.id), 10);

        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Submit verification
        const verification = await verificationService.submitVerification(
            validationResult.data,
            userId,
            ipAddress,
            userAgent
        );

        return NextResponse.json(
            { success: true, message: 'Verification submitted successfully', data: verification },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Error submitting verification:', error);

        if (error.code === 'NOT_FOUND') {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 404 }
            );
        }

        if (error.code === 'UNAUTHORIZED') {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 403 }
            );
        }

        if (error.code === 'VALIDATION_ERROR') {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        if (error.code === 'CONFLICT') {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to submit verification' },
            { status: 500 }
        );
    }
}
