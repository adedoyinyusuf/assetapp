import { getAssetLifecycleDetails } from '@/app/assets/lifecycle-actions';
import { AssetLabelModal } from '@/components/assets/AssetLabelModal';
import { DepreciationSchedule } from '@/components/assets/DepreciationSchedule';
import { CustodyAssignmentModal } from '@/components/assets/CustodyAssignmentModal';
import AssetMovementForm from '@/components/AssetMovementForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import VerificationHistoryWidget from '@/components/stock-verification/VerificationHistoryWidget';
import AssetVerificationStatus from '@/components/stock-verification/AssetVerificationStatus';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, MapPin, Calendar, DollarSign, Box, ArrowLeft, History, ArrowRight, Wrench, FileText, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AuditTimeline } from '@/components/assets/AuditTimeline';
import { Badge } from '@/components/ui/badge';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper for safe property access
const safeCategoryName = (asset: any) => asset.category?.name || 'Unknown';
const safeStateName = (asset: any) => asset.state?.name || 'Unknown State';
const safeLgaName = (asset: any) => asset.lga?.name || 'Unknown LGA';

export default async function AssetDetailsPage({ params }: { params: { id: string } }) {
  const asset: any = await getAssetLifecycleDetails(parseInt(params.id));

  if (!asset) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Asset Not Found</h1>
        <Button asChild variant="outline">
          <Link href="/assets/manage">Back to Inventory</Link>
        </Button>
      </div>
    );
  }

  const formattedValue = (val: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/assets/manage"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Asset List
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
            <Badge variant={asset.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {asset.status || 'ACTIVE'}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <Box className="h-4 w-4" />
              {safeCategoryName(asset)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {safeStateName(asset)}, {safeLgaName(asset)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Purchased {formatDate(asset.purchaseDate)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <CustodyAssignmentModal assetId={asset.id} currentCustodian={asset.assignedToUser} />
          <AssetLabelModal asset={asset} />
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href={`/stock-verification/verifications/new?assetId=${asset.id}`}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verify Asset
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/assets/edit/${asset.id}`}>
              Edit Details
            </Link>
          </Button>
        </div>
      </div>

      {/* Verification Status Banner */}
      <AssetVerificationStatus assetId={asset.id} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Lifecycle Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="procurement">Procurement</TabsTrigger>
              <TabsTrigger value="disposal">Disposal</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            {/* TAB: OVERVIEW */}
            <TabsContent value="overview" className="space-y-8">
              {/* Key Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formattedValue(asset.currentValue || asset.purchaseValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Depreciated from {formattedValue(asset.purchaseValue)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Useful Life</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {asset.usefulLife} Years
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Standard for {safeCategoryName(asset)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Category Description</h4>
                      <p>{asset.category?.description || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Exact Location</h4>
                      <p>{safeStateName(asset)} - {safeLgaName(asset)}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Salvage Value</h4>
                      <p>{formattedValue(asset.salvageValue)}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Annual Depreciation</h4>
                      <p>{asset.usefulLife ? formattedValue((asset.purchaseValue - asset.salvageValue) / asset.usefulLife) : 'N/A'} / year</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Asset Code</h4>
                      <p className="font-mono text-sm font-bold text-primary">{asset.assetCode || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identity & Tracking Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Identity & Tracking</CardTitle>
                  <CardDescription>Unique identifiers and tracking information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Serial Number</h4>
                      <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">{asset.serialNumber || 'Not Set'}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Batch Number</h4>
                      <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">{asset.batchNumber || 'Not Set'}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Reference Number</h4>
                      <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">{asset.referenceNumber || 'Not Set'}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">IMEI No 1</h4>
                      <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">{asset.imei1 || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">IMEI No 2</h4>
                      <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">{asset.imei2 || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: DEPRECIATION */}
            <TabsContent value="depreciation" className="space-y-6">
              <DepreciationSchedule
                purchaseValue={asset.purchaseValue}
                salvageValue={asset.salvageValue}
                usefulLife={asset.usefulLife}
                purchaseDate={asset.purchaseDate}
              />
            </TabsContent>

            {/* TAB: MAINTENANCE */}
            <TabsContent value="maintenance" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  Work Orders & Requests
                </h3>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/maintenance/new?assetId=${asset.id}`}>+ New Request</Link>
                </Button>
              </div>

              {/* Active Work Orders */}
              {asset.workOrders && asset.workOrders.length > 0 ? (
                <div className="space-y-4">
                  {asset.workOrders.map((wo: any) => (
                    <Card key={wo.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-sm">{wo.title}</h4>
                          <p className="text-xs text-muted-foreground">Assigned to: {wo.assignee?.firstName || 'Vendor'} • Due: {formatDate(wo.completionDate)}</p>
                        </div>
                        <Badge variant="outline">{wo.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground text-sm">
                  No active work orders.
                </div>
              )}

              {/* Recent Requests */}
              <h4 className="text-sm font-medium text-gray-500 mt-6">Recent Requests</h4>
              <div className="space-y-2">
                {asset.maintenanceRequests && asset.maintenanceRequests.length > 0 ? (
                  asset.maintenanceRequests.map((req: any) => (
                    <div key={req.id} className="text-sm p-3 bg-slate-50 rounded border flex justify-between">
                      <span>{req.title} <span className="text-gray-400">by {req.requester?.firstName}</span></span>
                      <span className={`text-xs px-2 py-0.5 rounded ${req.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200'}`}>{req.status}</span>
                    </div>
                  ))
                ) : <p className="text-xs text-muted-foreground italic">No maintenance requests found.</p>}
              </div>
            </TabsContent>

            {/* TAB: PROCUREMENT */}
            <TabsContent value="procurement" className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Procurement Information</h3>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  {asset.purchaseOrder ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Vendor</p>
                        <p className="font-medium">{asset.purchaseOrder.vendor?.name || 'Unknown Vendor'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">PO Number</p>
                        <p className="font-medium">#{asset.purchaseOrder.id.toString().padStart(6, '0')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase Cost</p>
                        <p className="font-medium">{formattedValue(asset.purchaseValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase Date</p>
                        <p className="font-medium">{formatDate(asset.purchaseDate)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No Purchase Order linked to this asset.</p>
                      <Button variant="link" className="text-xs h-auto p-0 mt-2">Link PO</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>



            {/* TAB: DISPOSAL */}
            <TabsContent value="disposal" className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Disposal Records</h3>
              </div>

              <Card>
                <CardContent className="p-6">
                  {asset.disposalRecords && asset.disposalRecords.length > 0 ? (
                    <div className="space-y-6">
                      {asset.disposalRecords.map((record: any) => (
                        <div key={record.id} className="border-b last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">Disposed via {record.method}</h4>
                              <p className="text-xs text-muted-foreground">Processed by {record.processor?.firstName || 'Unknown'}</p>
                            </div>
                            <Badge variant="destructive">{formattedValue(record.proceeds)} Proceeds</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                            <div>
                              <span className="text-muted-foreground text-xs block">Disposal Date</span>
                              {formatDate(record.disposalDate)}
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Notes</span>
                              {record.notes || 'No notes'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trash2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No disposal records found.</p>
                      <Button variant="link" className="text-xs h-auto p-0 mt-2" asChild>
                        <Link href="/operations/disposal">Request Disposal</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: HISTORY (Movements) */}
            <TabsContent value="history" className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Movement History</h3>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {asset.movements && asset.movements.length > 0 ? (
                    <div className="relative border-l border-muted ml-3 space-y-6 pb-2">
                      {asset.movements.map((movement: any) => (
                        <div key={movement.id} className="ml-6 relative">
                          <div className="absolute -left-[31px] bg-background border rounded-full p-1">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-semibold text-sm">
                              Moved to {movement.toState?.name}, {movement.toLga?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(movement.movementDate)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {movement.fromState?.name}, {movement.fromLga?.name}
                          </p>
                          {movement.reason && (
                            <div className="mt-2 text-xs bg-muted/50 p-2 rounded">
                              Reason: {movement.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No movements recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: AUDIT */}
            <TabsContent value="audit" className="space-y-6">
              <AuditTimeline asset={asset} />
            </TabsContent>

          </Tabs>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          {/* Action Widget */}
          <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
            <h3 className="font-semibold">Quick Actions</h3>
            <AssetMovementForm
              assetId={asset.id}
              currentLocation={`${safeStateName(asset)}, ${safeLgaName(asset)}`}
              currentStateId={asset.stateId}
              currentLgaId={asset.lgaId}
              categoryName={safeCategoryName(asset)}
            />
          </div>

          {/* Verification Widget */}
          <VerificationHistoryWidget assetId={asset.id} />
        </div>

      </div>
    </div >
  );
}
