import { db } from "@/lib/db";
import { resolveDiscrepancy, assignDiscrepancy } from "@/app/stock-verification/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscrepancyResolutionModal } from "@/components/stock-verification/DiscrepancyResolutionModal";
import VerificationAuditLog from "@/components/stock-verification/VerificationAuditLog";

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
        ACKNOWLEDGED: 'bg-blue-100 text-blue-800',
        INVESTIGATING: 'bg-yellow-100 text-yellow-800',
        PENDING_APPROVAL: 'bg-purple-100 text-purple-800',
        APPROVED: 'bg-green-100 text-green-800',
        RESOLVED: 'bg-green-100 text-green-800',
        CLOSED: 'bg-gray-500 text-white',
        ESCALATED: 'bg-orange-100 text-orange-800',
    };

    const auditLogs = await getAuditLogs(discrepancy.id);

    const canResolve = discrepancy.status !== 'RESOLVED' && discrepancy.status !== 'CLOSED';

    return (
        <div className="container py-10 max-w-5xl" >
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

                {/* Maintenance Request Integration */}
                {(discrepancy.severity === 'CRITICAL' || discrepancy.severity === 'HIGH') && discrepancy.status !== 'RESOLVED' && discrepancy.status !== 'CLOSED' && (
                    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                        <CardHeader>
                            <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Action Required: Maintenance Recommended
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                This {discrepancy.severity.toLowerCase()} severity discrepancy may require immediate maintenance action to prevent further deterioration or safety issues.
                            </p>
                            <div className="flex gap-3">
                                <Button asChild>
                                    <Link href={`/maintenance/new?assetId=${discrepancy.verification.asset.id}&source=discrepancy&sourceId=${discrepancy.id}&description=${encodeURIComponent(`Maintenance required due to ${discrepancy.severity.toLowerCase()} discrepancy: ${discrepancy.description}`)}&priority=${discrepancy.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM'}`}>
                                        Create Maintenance Request
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={`/assets/${discrepancy.verification.asset.id}`}>
                                        View Asset Details
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                            {/* Resolve Form - Replaced by Modal */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Resolution Actions</label>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Use the comprehensive resolution tool to resolve this discrepancy and optionaly update the asset record.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <DiscrepancyResolutionModal
                                        discrepancyId={discrepancy.id}
                                        currentStatus={discrepancy.status}
                                        assetName={discrepancy.verification.asset.name}
                                        trigger={<Button>Resolve Discrepancy</Button>}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Audit Trail */}
                <div className="mt-6">
                    <VerificationAuditLog logs={auditLogs} />
                </div>
            </div>
        </div >
    );
}

// Helper to fetch audit logs
async function getAuditLogs(discrepancyId: number) {
    return await db.auditLog.findMany({
        where: {
            entityType: 'VerificationDiscrepancy',
            entityId: discrepancyId
        },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
}
