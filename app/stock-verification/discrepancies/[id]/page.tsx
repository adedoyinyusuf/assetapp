import { db } from "@/lib/db";
import { resolveDiscrepancy, assignDiscrepancy } from "@/app/stock-verification/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DiscrepancyDetailPage({ params }: { params: { id: string } }) {
    const discrepancyId = parseInt(params.id);

    const discrepancy = await db.verificationDiscrepancy.findUnique({
        where: { id: discrepancyId },
        include: {
            verification: {
                include: {
                    asset: {
                        include: {
                            category: true,
                            state: true,
                            lga: true,
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
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            },
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            },
            resolver: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            escalatedUser: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            }
        }
    });

    if (!discrepancy) {
        notFound();
    }

    // Get potential assignees (users with verification permissions)
    const users = await db.user.findMany({
        where: { isActive: true },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
        orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' }
        ],
        take: 50,
    });

    const severityColors = {
        LOW: 'bg-blue-100 text-blue-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-orange-100 text-orange-800',
        CRITICAL: 'bg-red-100 text-red-800',
    };

    const statusColors = {
        REPORTED: 'bg-gray-100 text-gray-800',
        ASSIGNED: 'bg-blue-100 text-blue-800',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
        PENDING_REVIEW: 'bg-purple-100 text-purple-800',
        RESOLVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        ESCALATED: 'bg-orange-100 text-orange-800',
    };

    const canResolve = discrepancy.status !== 'RESOLVED' && discrepancy.status !== 'REJECTED';

    return (
        <div className="container py-10 max-w-5xl">
            <div className="mb-6">
                <Link href="/stock-verification/discrepancies" className="text-sm text-muted-foreground hover:underline">
                    ← Back to Discrepancies
                </Link>
            </div>

            <div className="grid gap-6">
                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl mb-2">
                                    Discrepancy #{discrepancy.id}
                                </CardTitle>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge className={severityColors[discrepancy.severity]}>
                                        {discrepancy.severity} Severity
                                    </Badge>
                                    <Badge className={statusColors[discrepancy.status]}>
                                        {discrepancy.status.replace(/_/g, ' ')}
                                    </Badge>
                                    <Badge variant="outline">
                                        {discrepancy.discrepancyType.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                            </div>
                            {discrepancy.priority && (
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Priority</p>
                                    <p className="text-2xl font-bold">{discrepancy.priority}</p>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-muted-foreground">{discrepancy.description}</p>
                        </div>

                        {discrepancy.actionRequired && (
                            <div>
                                <h4 className="font-semibold mb-2">Action Required</h4>
                                <p className="text-muted-foreground">{discrepancy.actionRequired}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Asset Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Asset Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Asset Name</p>
                                <Link
                                    href={`/assets/${discrepancy.verification.asset.id}`}
                                    className="font-semibold hover:underline"
                                >
                                    {discrepancy.verification.asset.name}
                                </Link>
                            </div>
                            {discrepancy.verification.asset.serialNumber && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Serial Number</p>
                                    <p className="font-mono">{discrepancy.verification.asset.serialNumber}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Category</p>
                                <p>{discrepancy.verification.asset.category.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p>{discrepancy.verification.asset.state.name}, {discrepancy.verification.asset.lga.name}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Campaign & Verification */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign & Verification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Campaign</p>
                                <Link
                                    href={`/stock-verification/campaigns/${discrepancy.verification.campaign.id}`}
                                    className="font-semibold hover:underline"
                                >
                                    {discrepancy.verification.campaign.name}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Verification Record</p>
                                <Link
                                    href={`/stock-verification/verifications/${discrepancy.verification.id}`}
                                    className="text-primary hover:underline"
                                >
                                    View Verification →
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Reported</p>
                                <p>{new Date(discrepancy.createdAt).toLocaleString()}</p>
                            </div>
                            {discrepancy.dueDate && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Due Date</p>
                                    <p className={new Date(discrepancy.dueDate) < new Date() ? 'text-red-600 font-semibold' : ''}>
                                        {new Date(discrepancy.dueDate).toLocaleDateString()}
                                        {new Date(discrepancy.dueDate) < new Date() && ' (Overdue)'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Values Comparison */}
                {(discrepancy.expectedValue || discrepancy.actualValue) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Values Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Expected Value</p>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-mono text-sm">{discrepancy.expectedValue || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Actual Value</p>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-mono text-sm">{discrepancy.actualValue || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            {discrepancy.financialImpact && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground">Financial Impact</p>
                                    <p className="text-xl font-bold text-red-600">
                                        ₦{Number(discrepancy.financialImpact).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* People Involved */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team & Assignment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Reported By</p>
                                <p className="font-semibold">
                                    {discrepancy.reporter.firstName} {discrepancy.reporter.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{discrepancy.reporter.email}</p>
                            </div>
                            {discrepancy.assignee && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                                    <p className="font-semibold">
                                        {discrepancy.assignee.firstName} {discrepancy.assignee.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{discrepancy.assignee.email}</p>
                                </div>
                            )}
                        </div>

                        {discrepancy.resolver && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Resolved By</p>
                                <p className="font-semibold">
                                    {discrepancy.resolver.firstName} {discrepancy.resolver.lastName}
                                </p>
                                <p className="text-sm">on {new Date(discrepancy.resolutionDate!).toLocaleString()}</p>
                            </div>
                        )}

                        {discrepancy.escalatedUser && (
                            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                                    Escalated To
                                </p>
                                <p className="font-semibold">
                                    {discrepancy.escalatedUser.firstName} {discrepancy.escalatedUser.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    on {new Date(discrepancy.escalatedAt!).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Resolution */}
                {discrepancy.resolutionNotes ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resolution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                                    Resolution Notes
                                </p>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {discrepancy.resolutionNotes}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : canResolve && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Assign Form */}
                            {discrepancy.status === 'REPORTED' && (
                                <form action={assignDiscrepancy} className="space-y-4">
                                    <input type="hidden" name="discrepancyId" value={discrepancy.id} />
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Assign To Team Member</label>
                                        <select
                                            name="assigneeId"
                                            required
                                            className="w-full px-3 py-2 border rounded-md"
                                        >
                                            <option value="">Select a user...</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.firstName} {user.lastName} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button type="submit">Assign Discrepancy</Button>
                                </form>
                            )}

                            <Separator />

                            {/* Resolve Form */}
                            <form action={resolveDiscrepancy} className="space-y-4">
                                <input type="hidden" name="discrepancyId" value={discrepancy.id} />
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Resolution Notes *</label>
                                    <Textarea
                                        name="resolutionNotes"
                                        placeholder="Describe how the discrepancy was resolved..."
                                        className="min-h-[100px]"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" name="action" value="resolve">
                                        Mark as Resolved
                                    </Button>
                                    <Button type="submit" name="action" value="reject" variant="destructive">
                                        Reject/Close
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Tags */}
                {discrepancy.tags && discrepancy.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {discrepancy.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
