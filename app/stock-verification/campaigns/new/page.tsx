import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import CampaignForm from "../../components/CampaignForm";

export default async function NewCampaignPage() {
    // Get User Context
    const session = await getServerSession(authOptions);
    let stateFilter = {};

    if (session?.user?.email) {
        const user = await db.user.findUnique({
            where: { email: session.user.email }
        });

        // Cast to any to access stateId until client types are fully synced
        const userAny = user as any;
        if (userAny?.stateId) {
            stateFilter = { id: userAny.stateId };
        } else if (userAny?.lgaId) {
            // If user is LGA scoped, we still need the State ID implies by LGA
            // We can fetch the LGA to find the State ID
            const lga = await db.lGA.findUnique({
                where: { id: userAny.lgaId },
                select: { stateId: true }
            });
            if (lga) {
                stateFilter = { id: lga.stateId };
            }
        }
    }

    // Fetch states and categories for selection
    const [states, categories] = await Promise.all([
        db.state.findMany({
            where: stateFilter,
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        db.category.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <div className="container py-10 max-w-6xl">
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
                <Link
                    href="/stock-verification/campaigns"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                    ← Back to Campaigns
                </Link>
            </div>

            {/* Page Header */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Create Verification Campaign</CardTitle>
                    <CardDescription className="text-base">
                        Set up a new asset verification campaign to track and verify assets across locations.
                        The system will automatically calculate the number of assets that match your selected scope.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Campaign Form */}
            <CampaignForm states={states} categories={categories} />
        </div>
    );
}
