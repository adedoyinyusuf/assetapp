import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export default async function DiscrepanciesPage() {
    const session = await getServerSession(authOptions);
    let accessFilter: any = {};

    if (session?.user?.email) {
        const user = await db.user.findUnique({
            where: { email: session.user.email },
            include: { role: true }
        });

        if (user) {
            const roleName = user.role.name.toUpperCase();
            if (!['SUPER_ADMIN', 'SUPERADMIN'].includes(roleName)) {
                // Cast to any for dynamic properties
                const userAny = user as any;
                if (userAny.lgaId) {
                    accessFilter = {
                        verification: {
                            asset: { lgaId: userAny.lgaId }
                        }
                    };
                } else if (userAny.stateId) {
                    accessFilter = {
                        verification: {
                            asset: { stateId: userAny.stateId }
                        }
                    };
                }
            }
        }
    }

    const discrepancies = await db.verificationDiscrepancy.findMany({
        where: accessFilter,
        include: {
            verification: {
                include: {
                    asset: {
                        select: {
                            id: true,
                            name: true,
                            serialNumber: true,
                        }
                    },
                    campaign: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            },
            reporter: {
                select: {
                    firstName: true,
                    lastName: true,
                }
            },
            assignee: {
                select: {
                    firstName: true,
                    lastName: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 50,
    });

    const stats = {
        total: discrepancies.length,
        reported: discrepancies.filter(d => d.status === 'REPORTED').length,
        investigating: discrepancies.filter(d => d.status === 'INVESTIGATING').length,
        pendingApproval: discrepancies.filter(d => d.status === 'PENDING_APPROVAL').length,
        resolved: discrepancies.filter(d => d.status === 'RESOLVED').length,
    };

    const severityColors = {
        LOW: 'bg-blue-100 text-blue-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-orange-100 text-orange-800',
        CRITICAL: 'bg-red-100 text-red-800',
    };

    const statusColors: Record<string, string> = {
        REPORTED: 'bg-gray-100 text-gray-800',
        ACKNOWLEDGED: 'bg-blue-100 text-blue-800',
        INVESTIGATING: 'bg-yellow-100 text-yellow-800',
        PENDING_APPROVAL: 'bg-purple-100 text-purple-800',
        APPROVED: 'bg-green-100 text-green-800',
        RESOLVED: 'bg-green-100 text-green-800',
        CLOSED: 'bg-gray-500 text-white',
        ESCALATED: 'bg-orange-100 text-orange-800',
    };

    return (
        <div className="container py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Verification Discrepancies</h1>
                <p className="text-muted-foreground">Track and resolve asset verification issues</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reported</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{stats.reported}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Investigating</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.investigating}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Discrepancies List */}
            <div className="space-y-4">
                {discrepancies.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <div className="text-6xl mb-4">✓</div>
                            <h3 className="text-lg font-semibold mb-2">No discrepancies</h3>
                            <p className="text-muted-foreground">
                                All verifications are clean. Discrepancies will appear here when issues are found.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    discrepancies.map((discrepancy) => {
                        const isOverdue = discrepancy.dueDate && new Date(discrepancy.dueDate) < new Date();

                        return (
                            <Link key={discrepancy.id} href={`/stock-verification/discrepancies/${discrepancy.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="text-lg font-semibold">
                                                        {discrepancy.verification.asset.name}
                                                    </h3>
                                                    <Badge className={severityColors[discrepancy.severity]}>
                                                        {discrepancy.severity}
                                                    </Badge>
                                                    <Badge className={statusColors[discrepancy.status]}>
                                                        {discrepancy.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {discrepancy.discrepancyType.replace(/_/g, ' ')}
                                                    </Badge>
                                                    {isOverdue && (
                                                        <Badge variant="destructive">Overdue</Badge>
                                                    )}
                                                </div>

                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {discrepancy.description}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                    <div>
                                                        Campaign: <span className="text-foreground">{discrepancy.verification.campaign.name}</span>
                                                    </div>
                                                    <div>
                                                        Reported by: <span className="text-foreground">
                                                            {discrepancy.reporter.firstName} {discrepancy.reporter.lastName}
                                                        </span>
                                                    </div>
                                                    {discrepancy.assignee && (
                                                        <div>
                                                            Assigned to: <span className="text-foreground">
                                                                {discrepancy.assignee.firstName} {discrepancy.assignee.lastName}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        {new Date(discrepancy.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {discrepancy.priority && (
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-muted-foreground">
                                                        P{discrepancy.priority}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Priority</div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
