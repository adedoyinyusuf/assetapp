import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import VerificationForm from "../../components/VerificationForm";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export default async function NewVerificationPage() {
    const session = await getServerSession(authOptions);
    let assetScopeFilter: any = {};

    if (session?.user?.email) {
        const user = await db.user.findUnique({
            where: { email: session.user.email },
            include: { role: true }
        });

        if (user) {
            const roleName = user.role.name.toUpperCase();
            if (!['SUPER_ADMIN', 'SUPERADMIN'].includes(roleName)) {
                const userAny = user as any;
                if (userAny.lgaId) {
                    assetScopeFilter = { lgaId: userAny.lgaId };
                } else if (userAny.stateId) {
                    assetScopeFilter = { stateId: userAny.stateId };
                }
            }
        }
    }

    // Fetch active campaigns and assets
    const [campaigns, assets] = await Promise.all([
        db.verificationCampaign.findMany({
            where: {
                status: {
                    in: ['ACTIVE', 'PLANNED']
                }
            },
            select: {
                id: true,
                name: true,
                status: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        db.asset.findMany({
            where: {
                status: {
                    not: 'DISPOSED'
                },
                ...assetScopeFilter
            },
            select: {
                id: true,
                name: true,
                serialNumber: true,
                category: {
                    select: { name: true }
                },
                state: {
                    select: { name: true }
                },
                lga: {
                    select: { name: true }
                }
            },
            orderBy: { name: 'asc' },
            take: 1000,
        }),
    ]);

    return (
        <div className="container py-10 max-w-5xl">
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
                <Link
                    href="/stock-verification/verifications"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                    ← Back to Verifications
                </Link>
            </div>

            {/* Page Header */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">New Asset Verification</CardTitle>
                    <CardDescription className="text-base">
                        Record verification details for an asset. Use QR scanner for quick identification or select manually from the list.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* No Campaigns Warning */}
            {campaigns.length === 0 && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Active Campaigns</AlertTitle>
                    <AlertDescription>
                        You need to create a verification campaign before you can record verifications.{' '}
                        <Link href="/stock-verification/campaigns/new" className="underline font-medium">
                            Create a campaign now
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            {/* Verification Form */}
            <Card>
                <CardContent className="pt-6">
                    <VerificationForm campaigns={campaigns} assets={assets} />
                </CardContent>
            </Card>
        </div>
    );
}
