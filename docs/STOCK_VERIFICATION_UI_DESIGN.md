# Stock Verification UI/UX Component Design

## Overview
This document outlines the user interface and user experience design for the Stock Verification module, including React components, pages, forms, and user workflows integrated into the NPC Asset Management System.

## Table of Contents
1. [Design Principles](#design-principles)
2. [Navigation Integration](#navigation-integration)
3. [Page Structure](#page-structure)
4. [Component Library](#component-library)
5. [User Workflows](#user-workflows)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)

---

## Design Principles

### 1. Consistency with Existing System
- Follow existing Material Design 3 patterns from the current system
- Use established color scheme and typography
- Maintain consistent navigation patterns
- Leverage existing UI component library (Radix UI)

### 2. User-Centered Design
- Role-based interface customization
- Progressive disclosure of complex features
- Clear visual hierarchy and information architecture
- Intuitive workflows for field verification teams

### 3. Mobile-First Approach
- Optimized for tablet and mobile devices used in field verification
- Touch-friendly interfaces with adequate button sizes
- Offline capability support
- Photo capture integration

---

## Navigation Integration

### Main Navigation Addition
```typescript
// Addition to existing navigation structure
{
  title: "Stock Verification",
  icon: <SearchIcon />,
  href: "/stock-verification",
  badge: {
    content: pendingVerifications,
    variant: "warning"
  },
  children: [
    {
      title: "Dashboard",
      href: "/stock-verification",
      icon: <DashboardIcon />
    },
    {
      title: "Campaigns",
      href: "/stock-verification/campaigns",
      icon: <CampaignIcon />
    },
    {
      title: "Verifications",
      href: "/stock-verification/verify",
      icon: <VerifyIcon />
    },
    {
      title: "Discrepancies",
      href: "/stock-verification/discrepancies",
      icon: <AlertIcon />,
      badge: {
        content: openDiscrepancies,
        variant: "error"
      }
    },
    {
      title: "Reports",
      href: "/stock-verification/reports",
      icon: <ReportIcon />
    }
  ]
}
```

### Breadcrumb Integration
```typescript
// Dynamic breadcrumb structure
interface StockVerificationBreadcrumb {
  "/stock-verification": "Stock Verification";
  "/stock-verification/campaigns": "Campaigns";
  "/stock-verification/campaigns/new": "New Campaign";
  "/stock-verification/campaigns/[id]": campaignName;
  "/stock-verification/campaigns/[id]/verify": "Verify Assets";
  "/stock-verification/discrepancies": "Discrepancies";
  "/stock-verification/reports": "Reports";
}
```

---

## Page Structure

### 1. Dashboard Page (`/app/stock-verification/page.tsx`)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationOverview } from "@/components/stock-verification/VerificationOverview";
import { CampaignProgress } from "@/components/stock-verification/CampaignProgress";
import { RecentActivity } from "@/components/stock-verification/RecentActivity";
import { DiscrepancyAlerts } from "@/components/stock-verification/DiscrepancyAlerts";

export default function StockVerificationDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Stock Verification</h2>
        <div className="flex items-center space-x-2">
          <QuickActionButton />
          <RefreshButton />
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Active Campaigns" value={activeCampaigns} />
            <StatCard title="Pending Verifications" value={pendingVerifications} />
            <StatCard title="Open Discrepancies" value={openDiscrepancies} />
            <StatCard title="Completion Rate" value={completionRate} />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Verification Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <VerificationProgressChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2. Campaigns Page (`/app/stock-verification/campaigns/page.tsx`)

```typescript
import { DataTable } from "@/components/ui/data-table";
import { CampaignCard } from "@/components/stock-verification/CampaignCard";
import { CreateCampaignDialog } from "@/components/stock-verification/CreateCampaignDialog";
import { CampaignFilters } from "@/components/stock-verification/CampaignFilters";

export default function CampaignsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Verification Campaigns</h2>
        <div className="flex items-center space-x-2">
          <ViewToggle view={view} onViewChange={setView} />
          <CreateCampaignDialog />
        </div>
      </div>
      
      <CampaignFilters />
      
      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <DataTable columns={campaignColumns} data={campaigns} />
      )}
    </div>
  );
}
```

### 3. Verification Interface (`/app/stock-verification/campaigns/[id]/verify/page.tsx`)

```typescript
import { VerificationForm } from "@/components/stock-verification/VerificationForm";
import { AssetSelector } from "@/components/stock-verification/AssetSelector";
import { PhotoCapture } from "@/components/stock-verification/PhotoCapture";
import { QRScanner } from "@/components/stock-verification/QRScanner";

export default function VerifyAssetsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Asset Verification</h2>
        <div className="flex items-center space-x-2">
          <BatchOperationsButton />
          <SaveProgressButton />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <VerificationForm campaignId={params.id} />
        </div>
        <div className="space-y-4">
          <AssetSelector campaignId={params.id} />
          <QRScanner />
          <PhotoCapture />
        </div>
      </div>
    </div>
  );
}
```

---

## Component Library

### 1. Campaign Management Components

#### `CampaignCard.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface CampaignCardProps {
  campaign: VerificationCampaignSummary;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onStart?: (id: number) => void;
}

export function CampaignCard({ campaign, onView, onEdit, onStart }: CampaignCardProps) {
  const statusColors = {
    PLANNED: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{campaign.name}</CardTitle>
        <Badge className={statusColors[campaign.status]}>
          {campaign.status}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(campaign.verificationProgress)}%</span>
            </div>
            <Progress value={campaign.verificationProgress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(campaign.startDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">End Date</p>
              <p className="font-medium">{formatDate(campaign.endDate)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Verified</p>
              <p className="font-medium text-green-600">
                {campaign.stats.completedVerifications}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Discrepancies</p>
              <p className="font-medium text-red-600">
                {campaign.stats.discrepancyCount}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => onView?.(campaign.id)}>
              View Details
            </Button>
            {campaign.status === 'PLANNED' && (
              <Button size="sm" onClick={() => onStart?.(campaign.id)}>
                Start Campaign
              </Button>
            )}
            {campaign.status === 'ACTIVE' && (
              <Button size="sm" onClick={() => onView?.(campaign.id)}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### `CreateCampaignDialog.tsx`
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelect } from "@/components/ui/multi-select";

export function CreateCampaignDialog() {
  const form = useForm<CreateCampaignRequest>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      assignedStates: [],
      assignedLgas: [],
      assignedCategories: []
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Verification Campaign</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Q4 2024 Asset Verification" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Comprehensive verification of all assets..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <DatePicker
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <DatePicker
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="assignedStates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned States</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={states}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select states..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedLgas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned LGAs (Optional)</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={lgas}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select LGAs..."
                        disabled={!form.watch('assignedStates').length}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedCategories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Categories (Optional)</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={categories}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select categories..."
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to include all categories
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific instructions for verification teams..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Verification Components

#### `VerificationForm.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface VerificationFormProps {
  campaignId: string;
  assetId?: number;
  onSubmit: (data: UpdateVerificationRequest) => void;
  initialData?: AssetVerification;
}

export function VerificationForm({ campaignId, assetId, onSubmit, initialData }: VerificationFormProps) {
  const form = useForm<UpdateVerificationRequest>({
    resolver: zodResolver(updateVerificationSchema),
    defaultValues: initialData || {
      status: 'IN_PROGRESS',
      locationAccurate: true,
      physicalCondition: undefined,
      notes: ""
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Asset Verification
          {assetId && <AssetInfoBadge assetId={assetId} />}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="DISCREPANCY_FOUND">Discrepancy Found</SelectItem>
                        <SelectItem value="MISSING">Missing</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                        <SelectItem value="REQUIRES_REVIEW">Requires Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="physicalCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EXCELLENT">Excellent</SelectItem>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="POOR">Poor</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                        <SelectItem value="MISSING">Missing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="locationAccurate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Location Accurate</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Is the asset in the expected location?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {!form.watch('locationAccurate') && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="actualStateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual State</FormLabel>
                        <StateSelect
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="actualLgaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual LGA</FormLabel>
                        <LGASelect
                          stateId={form.watch('actualStateId')}
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <FormField
                control={form.control}
                name="actualLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Location Details</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Building, Room, Floor, etc."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Estimated Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="witnessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Witness Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Name of person present during verification"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional observations, issues, or comments..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline">
                Save Draft
              </Button>
              <Button type="submit">
                Submit Verification
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

#### `PhotoCapture.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, X } from "lucide-react";

interface PhotoCaptureProps {
  verificationId?: number;
  maxFiles?: number;
  onPhotosChange: (photos: string[]) => void;
  initialPhotos?: string[];
}

export function PhotoCapture({ verificationId, maxFiles = 10, onPhotosChange, initialPhotos = [] }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      if (verificationId) {
        formData.append('verificationId', verificationId.toString());
      }
      
      const response = await fetch('/api/stock-verification/upload/photos', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      const newPhotos = [...photos, ...result.uploadedFiles.map(f => f.url)];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Verification Photos
          <Badge variant="secondary">{photos.length}/{maxFiles}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || photos.length >= maxFiles}
          >
            <Camera className="mr-2 h-4 w-4" />
            Camera
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || photos.length >= maxFiles}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
        
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
        
        <Input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
        
        {uploading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Uploading photos...
          </div>
        )}
        
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Verification photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {photos.length === 0 && (
          <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">
              No photos added yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### `QRScanner.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search } from "lucide-react";

interface QRScannerProps {
  onAssetScanned: (assetId: number) => void;
  onAssetNotFound: (qrData: string) => void;
}

export function QRScanner({ onAssetScanned, onAssetNotFound }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start QR detection loop
        detectQR();
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const detectQR = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Use a QR code detection library here (e.g., qr-scanner)
    // This is a simplified version
    setTimeout(() => {
      if (scanning) detectQR();
    }, 100);
  };

  const processQRData = async (qrData: string) => {
    try {
      // Extract asset ID from QR code data
      const assetId = extractAssetIdFromQR(qrData);
      if (assetId) {
        onAssetScanned(assetId);
      } else {
        onAssetNotFound(qrData);
      }
    } catch (error) {
      onAssetNotFound(qrData);
    }
  };

  const handleManualLookup = async () => {
    if (manualInput.trim()) {
      await processQRData(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="mr-2 h-5 w-5" />
          QR/Barcode Scanner
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!scanning ? (
          <>
            <Button onClick={startScanning} className="w-full">
              <QrCode className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Or enter manually:</p>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter asset code"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                />
                <Button size="sm" onClick={handleManualLookup}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-48 object-cover rounded border"
                autoPlay
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white rounded-lg w-32 h-32 opacity-50" />
              </div>
            </div>
            
            <Button onClick={stopScanning} variant="outline" className="w-full">
              Stop Scanning
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3. Discrepancy Management Components

#### `DiscrepancyCard.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, User } from "lucide-react";

interface DiscrepancyCardProps {
  discrepancy: DiscrepancySummary;
  onView?: (id: number) => void;
  onAssign?: (id: number) => void;
  onResolve?: (id: number) => void;
}

export function DiscrepancyCard({ discrepancy, onView, onAssign, onResolve }: DiscrepancyCardProps) {
  const severityColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800', 
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800'
  };
  
  const statusColors = {
    REPORTED: 'bg-blue-100 text-blue-800',
    ACKNOWLEDGED: 'bg-purple-100 text-purple-800',
    INVESTIGATING: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <AlertTriangle className="mr-2 h-4 w-4" />
          {discrepancy.discrepancyType.replace('_', ' ')}
        </CardTitle>
        <div className="flex space-x-1">
          <Badge className={severityColors[discrepancy.severity]}>
            {discrepancy.severity}
          </Badge>
          <Badge className={statusColors[discrepancy.status]}>
            {discrepancy.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {discrepancy.description}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {formatRelativeTime(discrepancy.createdAt)}
            </div>
            {discrepancy.assignee && (
              <div className="flex items-center">
                <User className="mr-1 h-3 w-3" />
                {discrepancy.assignee.firstName} {discrepancy.assignee.lastName}
              </div>
            )}
          </div>
          
          {discrepancy.dueDate && (
            <div className="text-xs text-muted-foreground">
              Due: {formatDate(discrepancy.dueDate)}
            </div>
          )}
          
          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => onView?.(discrepancy.id)}>
              View Details
            </Button>
            {!discrepancy.assignee && (
              <Button size="sm" onClick={() => onAssign?.(discrepancy.id)}>
                Assign
              </Button>
            )}
            {discrepancy.status === 'INVESTIGATING' && (
              <Button size="sm" onClick={() => onResolve?.(discrepancy.id)}>
                Resolve
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## User Workflows

### 1. Campaign Creation Workflow
1. **Access**: Navigate to Stock Verification → Campaigns
2. **Initiate**: Click "New Campaign" button
3. **Configure**: Fill campaign details form
4. **Scope**: Select states, LGAs, and categories
5. **Schedule**: Set start and end dates
6. **Review**: Preview campaign scope and estimated assets
7. **Create**: Submit campaign for creation
8. **Setup**: Assign teams and configure permissions

### 2. Asset Verification Workflow
1. **Select Campaign**: Choose active campaign
2. **Scan/Select Asset**: Use QR scanner or manual selection
3. **Verify Location**: Confirm or update asset location
4. **Assess Condition**: Record physical condition
5. **Capture Photos**: Take verification photos
6. **Document Issues**: Record any discrepancies
7. **Add Notes**: Include additional observations
8. **Submit**: Complete verification process

### 3. Discrepancy Management Workflow
1. **Identify**: Discrepancy detected during verification
2. **Report**: Auto-created or manually reported
3. **Assign**: Assigned to appropriate team member
4. **Investigate**: Gather additional information
5. **Resolve**: Implement corrective actions
6. **Verify**: Confirm resolution effectiveness
7. **Close**: Mark as resolved and closed

---

## Responsive Design

### Breakpoint Strategy
```css
/* Mobile First Approach */
.verification-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .verification-grid {
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .verification-grid {
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .verification-grid {
    grid-template-columns: 3fr 1fr;
  }
}
```

### Mobile Optimizations
- Touch-friendly buttons (minimum 44px height)
- Simplified forms with progressive disclosure
- Optimized photo capture interface
- Swipe gestures for navigation
- Offline support with local storage

---

## Accessibility

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and descriptions
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Images with descriptive alt text

### Implementation Examples
```typescript
// Proper ARIA labeling
<Button
  aria-label="Create new verification campaign"
  aria-describedby="campaign-help-text"
>
  New Campaign
</Button>

// Screen reader announcements
<div aria-live="polite" aria-atomic="true">
  {status === 'loading' && 'Loading verification data...'}
  {status === 'success' && 'Verification saved successfully'}
  {status === 'error' && 'Error saving verification'}
</div>

// Semantic HTML structure
<main role="main">
  <h1>Stock Verification Dashboard</h1>
  <section aria-labelledby="active-campaigns">
    <h2 id="active-campaigns">Active Campaigns</h2>
    {/* Campaign content */}
  </section>
</main>
```

---

*This UI/UX design provides a comprehensive, user-friendly interface for the Stock Verification module, ensuring seamless integration with the existing NPC Asset Management System while maintaining high usability standards for field verification teams.*