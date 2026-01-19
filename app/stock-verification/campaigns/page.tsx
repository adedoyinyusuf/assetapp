import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { CampaignService } from "@/lib/stock-verification/campaign-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Plus, Calendar, Users, CheckCircle2, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/stock-verification/base-service";
import { CampaignListActions } from "../components/CampaignListActions";

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userId = parseInt(session.user.id);
  const campaignService = new CampaignService();

  let campaigns: any[] = [];
  let stats = { total: 0, active: 0, completed: 0, planned: 0 };
  let error = null;

  try {
    const result = await campaignService.getCampaigns({
      page: 1,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }, userId);

    campaigns = result.data;

    stats = {
      total: result.pagination.total,
      active: campaigns.filter(c => c.status === 'ACTIVE').length,
      completed: campaigns.filter(c => c.status === 'COMPLETED').length,
      planned: campaigns.filter(c => c.status === 'PLANNED').length,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      error = "You do not have permission to view campaigns.";
    } else {
      console.error("Error fetching campaigns:", err);
      error = "Failed to load campaigns.";
    }
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/stock-verification">
            <Button variant="outline" className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const canCreate = !["VERIFIER", "ASSISTANT_VERIFIER", "VIEWER"].some(r => (session.user.role || '').includes(r));

  return (
    <div className="container py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verification Campaigns</h1>
          <p className="text-muted-foreground">
            {["VERIFIER", "Assistant Verifier"].includes(session.user.role || '')
              ? "View your assigned verification campaigns"
              : "Plan and manage asset verification campaigns"
            }
          </p>
        </div>
        <CampaignListActions showCreateButton={canCreate} />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visibility</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.planned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-6">
                {["VERIFIER", "Assistant Verifier"].includes(session.user.role || '')
                  ? "You haven't been assigned to any campaigns yet."
                  : "Create your first verification campaign to start tracking assets"
                }
              </p>
              {canCreate && (
                <Link href="/stock-verification/campaigns/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const verifiedCount = (campaign as any).stats?.verifiedAssets ?? campaign.verifiedAssetCount ?? 0;
            const targetCount = campaign.targetAssetCount ?? 0;
            const progress = (targetCount > 0) ? (verifiedCount / targetCount) * 100 : 0;
            const isActive = campaign.status === 'ACTIVE';

            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Link href={`/stock-verification/campaigns/${campaign.id}`} className="hover:underline">
                          {campaign.name}
                        </Link>
                        {isActive && <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>}
                        {!isActive && <Badge variant="secondary">{campaign.status}</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{campaign.description}</p>
                    </div>
                    <Link href={`/stock-verification/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progress)}% ({verifiedCount}/{targetCount})</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{(campaign as any).assignments?.length || 0} Verifiers</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}