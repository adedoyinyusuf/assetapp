'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CampaignDetailSkeleton } from '@/components/ui/skeletons';
import { mobileOptimized, animations } from '@/lib/ui-utils';
import {
    Target, CheckCircle2, AlertCircle, Calendar, Users,
    Play, Pause, CheckSquare, XCircle, Archive, ArrowLeft,
    TrendingUp, MapPin, Layers, FileText, BarChart3, Loader2,
    Clock, DollarSign, UserPlus
} from 'lucide-react';
import { TeamPerformanceChart, StatusDistributionChart } from '@/components/charts';
import { ActivityFeed, CampaignProgress, AssignmentDialog } from '@/components/campaign';

interface CampaignDetails {
    id: number;
    name: string;
    description?: string;
    status: string;
    startDate: string;
    endDate: string;
    targetAssetCount?: number;
    verifiedAssetCount?: number;
    verificationProgress?: number;
    budget?: number;
    instructions?: string;
    createdAt: string;
    updatedAt: string;
    assignedStates: number[];
    assignedLgas: number[];
    assignedCategories: number[];
    creator: {
        firstName?: string;
        lastName?: string;
        email: string;
    };
    _count: {
        verifications: number;
        assignments: number;
        discrepancies: number;
    };
}

interface CampaignDetailClientProps {
    campaignId: string;
}

const statusConfig = {
    PLANNED: { color: 'bg-blue-500', label: 'Planned', icon: FileText },
    ACTIVE: { color: 'bg-success', label: 'Active', icon: Play },
    PAUSED: { color: 'bg-warning', label: 'Paused', icon: Pause },
    COMPLETED: { color: 'bg-gray-500', label: 'Completed', icon: CheckSquare },
    CANCELLED: { color: 'bg-destructive', label: 'Cancelled', icon: XCircle },
    ARCHIVED: { color: 'bg-purple-500', label: 'Archived', icon: Archive },
};

export default function CampaignDetailClient({ campaignId }: CampaignDetailClientProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const isManagerial = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEAM_LEADER'].includes(userRole || '');

    const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

    useEffect(() => {
        fetchCampaign();
    }, [campaignId]);

    const fetchCampaign = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/stock-verification/campaigns/${campaignId}`);

            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Campaign not found' : 'Failed to load campaign');
            }

            const data = await response.json();
            if (data.success) {
                setCampaign(data.data);
            } else {
                throw new Error(data.error || 'Failed to fetch campaign');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load campaign');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string) => {
        try {
            setActionLoading(action);
            const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            const result = await response.json();
            if (result.success) {
                await fetchCampaign();
            } else {
                setError(result.error || 'Action failed');
            }
        } catch (err) {
            setError('Failed to execute action');
        } finally {
            setActionLoading(null);
        }
    };

    const getActions = (status: string) => {
        const actions: Record<string, { label: string; icon: any; variant: any; action: string }[]> = {
            PLANNED: [
                { label: 'Start Campaign', icon: Play, variant: 'default', action: 'start' },
                { label: 'Cancel', icon: XCircle, variant: 'destructive', action: 'cancel' },
            ],
            ACTIVE: [
                { label: 'Pause', icon: Pause, variant: 'outline', action: 'pause' },
                { label: 'Complete', icon: CheckSquare, variant: 'default', action: 'complete' },
            ],
            PAUSED: [
                { label: 'Resume', icon: Play, variant: 'default', action: 'resume' },
                { label: 'Cancel', icon: XCircle, variant: 'destructive', action: 'cancel' },
            ],
        };
        return actions[status] || [];
    };

    const handleAssignMember = async (userId: number, role: string) => {
        try {
            const res = await fetch(`/api/stock-verification/campaigns/${campaignId}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role })
            });

            if (!res.ok) throw new Error('Failed to assign member');

            // Refresh campaign data
            fetchCampaign();
            setAssignmentDialogOpen(false);
        } catch (error) {
            console.error(error);
            // You might want to show a toast here
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return <CampaignDetailSkeleton />;
    }

    if (error || !campaign) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    {error || 'Campaign not found'}
                    <Button variant="outline" size="sm" onClick={() => router.back()} className="ml-4">
                        Go Back
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const statusInfo = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.PLANNED;
    const daysRemaining = getDaysRemaining(campaign.endDate);
    const isExpired = daysRemaining < 0;
    const completionRate = campaign.targetAssetCount && campaign.verifiedAssetCount
        ? (campaign.verifiedAssetCount / campaign.targetAssetCount) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">{campaign.name}</h1>
                            <Badge className={statusInfo.color}>
                                <statusInfo.icon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Campaign #{campaign.id} • Created by {campaign.creator.firstName} {campaign.creator.lastName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${animations.fadeIn}`}>
                <Card className={`${animations.hoverLift} transition-all`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Target Assets</p>
                                <p className="text-2xl font-bold">
                                    {campaign.targetAssetCount?.toLocaleString() || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${animations.hoverLift} transition-all`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Verified</p>
                                <p className="text-2xl font-bold">{(campaign.verifiedAssetCount || 0).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{completionRate.toFixed(1)}% complete</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${animations.hoverLift} transition-all`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Discrepancies</p>
                                <p className="text-2xl font-bold">{campaign._count.discrepancies}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${animations.hoverLift} transition-all`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isExpired ? 'bg-destructive/10' : daysRemaining <= 7 ? 'bg-warning/10' : 'bg-primary/10'
                                }`}>
                                <Clock className={`w-6 h-6 ${isExpired ? 'text-destructive' : daysRemaining <= 7 ? 'text-warning' : 'text-primary'
                                    }`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {isExpired ? 'Expired' : 'Days Left'}
                                </p>
                                <p className={`text-2xl font-bold ${isExpired ? 'text-destructive' : daysRemaining <= 7 ? 'text-warning' : ''
                                    }`}>
                                    {Math.abs(daysRemaining)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Card */}
            <CampaignProgress
                campaignName={campaign.name}
                stats={{
                    totalAssets: campaign.targetAssetCount || 0,
                    verifiedCount: campaign.verifiedAssetCount || 0,
                    pendingCount: (campaign.targetAssetCount || 0) - (campaign.verifiedAssetCount || 0),
                    discrepancyCount: campaign._count.discrepancies,
                    progress: campaign.verificationProgress || 0,
                    daysRemaining: daysRemaining
                }}
            />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamPerformanceChart
                    data={[
                        { name: 'John D.', verified: 45, pending: 12, discrepancies: 3, role: 'VERIFIER' },
                        { name: 'Sarah M.', verified: 38, pending: 8, discrepancies: 2, role: 'VERIFIER' },
                        { name: 'Mike T.', verified: 52, pending: 15, discrepancies: 5, role: 'TEAM_LEAD' },
                        { name: 'Lisa K.', verified: 29, pending: 6, discrepancies: 1, role: 'VERIFIER' }
                    ]}
                    isLoading={loading}
                />

                <StatusDistributionChart
                    data={[
                        { name: 'VERIFIED', value: campaign.verifiedAssetCount || 0, color: '#22c55e' },
                        { name: 'PENDING', value: (campaign.targetAssetCount || 0) - (campaign.verifiedAssetCount || 0), color: '#eab308' },
                        { name: 'DISCREPANCY', value: campaign._count.discrepancies, color: '#ef4444' }
                    ]}
                    isLoading={loading}
                />
            </div>

            {/* Activity Feed */}
            <ActivityFeed
                activities={[
                    {
                        id: 1,
                        assetName: 'Dell Laptop XPS 15',
                        verifiedBy: 'John Doe',
                        status: 'VERIFIED',
                        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                        condition: 'Good'
                    },
                    {
                        id: 2,
                        assetName: 'HP Printer LaserJet',
                        verifiedBy: 'Sarah Mike',
                        status: 'DISCREPANCY',
                        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                        condition: 'Fair'
                    },
                    {
                        id: 3,
                        assetName: 'iPhone 13 Pro',
                        verifiedBy: 'Mike Johnson',
                        status: 'VERIFIED',
                        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
                        condition: 'Excellent'
                    }
                ]}
                isLoading={loading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Campaign Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {campaign.description && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="text-sm mt-1">{campaign.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                                <p className="text-sm mt-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(campaign.startDate)}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                                <p className="text-sm mt-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(campaign.endDate)}
                                </p>
                            </div>
                        </div>

                        {campaign.budget && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Budget</label>
                                <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    {formatCurrency(campaign.budget)}
                                </p>
                            </div>
                        )}

                        {campaign.instructions && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Instructions</label>
                                <div className="mt-2 p-3 bg-muted rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{campaign.instructions}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Coverage & Team */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Coverage & Team
                        </CardTitle>
                        {isManagerial && (
                            <Button size="sm" variant="outline" onClick={() => setAssignmentDialogOpen(true)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Manage Team
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Team Members</label>
                            <p className="text-2xl font-bold mt-1">{campaign._count.assignments}</p>
                            <p className="text-xs text-muted-foreground">people assigned</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Geographic Coverage
                            </label>
                            <div className="mt-2 space-y-2">
                                <p className="text-sm">
                                    {campaign.assignedStates.length > 0
                                        ? `${campaign.assignedStates.length} states`
                                        : 'All states'}
                                </p>
                                <p className="text-sm">
                                    {campaign.assignedLgas.length > 0
                                        ? `${campaign.assignedLgas.length} LGAs`
                                        : 'All LGAs'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Asset Categories
                            </label>
                            <p className="text-sm mt-2">
                                {campaign.assignedCategories.length > 0
                                    ? `${campaign.assignedCategories.length} categories`
                                    : 'All categories'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isManagerial && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Actions</CardTitle>
                            <CardDescription>Manage campaign status and workflow</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {getActions(campaign.status).map((action) => (
                                <Button
                                    key={action.action}
                                    variant={action.variant as any}
                                    className={`w-full justify-start ${mobileOptimized.touchTarget}`}
                                    onClick={() => handleAction(action.action)}
                                    disabled={actionLoading === action.action}
                                >
                                    {actionLoading === action.action ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <action.icon className="w-4 h-4 mr-2" />
                                    )}
                                    {action.label}
                                </Button>
                            ))}
                            {getActions(campaign.status).length === 0 && (
                                <p className="text-sm text-muted-foreground italic">
                                    No actions available for {statusInfo.label.toLowerCase()} campaigns
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card className={!isManagerial ? "col-span-1 lg:col-span-2" : ""}>
                    <CardHeader>
                        <CardTitle>Quick Navigation</CardTitle>
                        <CardDescription>View and manage campaign data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            variant="default" // Primary for everyone
                            className={`w-full justify-start ${mobileOptimized.touchTarget}`}
                            onClick={() => router.push(`/stock-verification/campaigns/${campaign.id}/verifications`)}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Verifications ({campaign._count.verifications})
                        </Button>

                        {!isManagerial && (
                            <Button
                                variant="outline"
                                className={`w-full justify-start ${mobileOptimized.touchTarget} border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800`}
                                onClick={() => router.push(`/stock-verification/verifications/new?campaignId=${campaign.id}`)}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Start New Verification
                            </Button>
                        )}

                        {isManagerial && (
                            <>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start ${mobileOptimized.touchTarget}`}
                                    onClick={() => router.push(`/stock-verification/campaigns/${campaign.id}/assignments`)}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Team Assignments ({campaign._count.assignments})
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start ${mobileOptimized.touchTarget}`}
                                    onClick={() => router.push(`/stock-verification/discrepancies?campaignId=${campaign.id}`)}
                                >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Discrepancies ({campaign._count.discrepancies})
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start ${mobileOptimized.touchTarget}`}
                                    onClick={() => router.push(`/stock-verification/reports?campaignId=${campaign.id}`)}
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Generate Reports
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
            <AssignmentDialog
                open={assignmentDialogOpen}
                onOpenChange={setAssignmentDialogOpen}
                campaignId={campaign.id}
                users={[]} // TODO: Fetch users list
                onAssign={handleAssignMember}
            />
        </div>
    );
}
