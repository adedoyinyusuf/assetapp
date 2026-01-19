'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createVerification } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, CheckCircle2, AlertCircle, Camera, Upload, X, Loader2, QrCode } from 'lucide-react';
import QRScanner from '@/components/stock-verification/QRScanner';
import { LocationCapture } from '@/components/verification';
import { PhotoGallery } from '@/components/verification';

interface Campaign {
    id: number;
    name: string;
    status: string;
}

interface Asset {
    id: number;
    name: string;
    serialNumber: string | null;
    category: { name: string };
    state: { name: string };
    lga: { name: string };
}

interface VerificationFormProps {
    campaigns: Campaign[];
    assets: Asset[];
}

export default function VerificationForm({ campaigns, assets }: VerificationFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [selectedAsset, setSelectedAsset] = useState('');
    const [condition, setCondition] = useState('');
    const [locationAccurate, setLocationAccurate] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [createMaintenance, setCreateMaintenance] = useState(false);
    const [createDiscrepancy, setCreateDiscrepancy] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [locationData, setLocationData] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);

    // Photo handling
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Validate file count
        if (files.length + photos.length > 5) {
            setError('Maximum 5 photos allowed');
            return;
        }

        // Validate file sizes (5MB each)
        const invalidFiles = files.filter(f => f.size > 5 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            setError('Each photo must be less than 5MB');
            return;
        }

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPhotoPreviews([...photoPreviews, ...newPreviews]);
        setPhotos([...photos, ...files]);
        setError(null);
    };

    const removePhoto = (index: number) => {
        URL.revokeObjectURL(photoPreviews[index]);
        setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
        setPhotos(photos.filter((_, i) => i !== index));
    };

    // Form validation
    const validateForm = () => {
        if (!selectedCampaign) {
            setError('Please select a campaign');
            return false;
        }
        if (!selectedAsset && !qrCode) {
            setError('Please select an asset or scan QR code');
            return false;
        }
        if (!condition) {
            setError('Please assess physical condition');
            return false;
        }
        if (!locationAccurate) {
            setError('Please verify location');
            return false;
        }
        return true;
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        const formData = new FormData(e.currentTarget);

        // Append photos from state
        formData.delete('photos'); // Remove any default input values
        photos.forEach(photo => {
            formData.append('photos', photo);
        });

        startTransition(async () => {
            try {
                await createVerification(formData);
                setSuccess(true);
                setTimeout(() => router.push('/stock-verification/verifications'), 1500);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create verification');
            }
        });
    };

    // Get condition badge color
    const getConditionColor = (cond: string) => {
        switch (cond) {
            case 'EXCELLENT': return 'bg-success/10 text-success border-success';
            case 'GOOD': return 'bg-primary/10 text-primary border-primary';
            case 'FAIR': return 'bg-warning/10 text-warning border-warning';
            case 'POOR': return 'bg-destructive/10 text-destructive border-destructive';
            case 'DAMAGED': return 'bg-destructive text-destructive-foreground';
            case 'MISSING': return 'bg-gray-500 text-white';
            default: return '';
        }
    };

    // Success state
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Verification Submitted!</h3>
                <p className="text-muted-foreground">Redirecting to verifications list...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <input type="hidden" name="qrCode" value={qrCode} />
            <input type="hidden" name="coordinates" value={locationData ? `${locationData.latitude},${locationData.longitude}` : ''} />

            {/* Campaign Selection */}
            <div className="space-y-3">
                <Label htmlFor="campaignId" className="text-base font-semibold">
                    Campaign <span className="text-destructive">*</span>
                </Label>
                <Select
                    name="campaignId"
                    value={selectedCampaign}
                    onValueChange={setSelectedCampaign}
                    required
                >
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                        {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                <div className="flex items-center gap-2">
                                    <span>{campaign.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-secondary'
                                        }`}>
                                        {campaign.status}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {campaigns.length === 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        No active campaigns available. Create one first.
                    </p>
                )}
            </div>

            {/* Asset Selection with QR Option */}
            <div className="space-y-4">
                <Label className="text-base font-semibold">
                    Asset Identification <span className="text-destructive">*</span>
                </Label>

                {/* QR Scanner Toggle */}
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={showQRScanner ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowQRScanner(!showQRScanner)}
                        className="flex-1"
                    >
                        <QrCode className="w-4 h-4 mr-2" />
                        {showQRScanner ? 'Using QR Scanner' : 'Scan QR Code'}
                    </Button>
                    <Button
                        type="button"
                        variant={!showQRScanner ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowQRScanner(false)}
                        className="flex-1"
                    >
                        Manual Selection
                    </Button>
                </div>

                {showQRScanner ? (
                    <QRScanner
                        onScan={(code) => {
                            setQrCode(code);
                            // Try to find asset by QR code
                            const assetMatch = assets.find(
                                asset => asset.serialNumber === code ||
                                    asset.id.toString() === code ||
                                    code.includes(`ASSET:${asset.id}`)
                            );
                            if (assetMatch) {
                                setSelectedAsset(assetMatch.id.toString());
                            }
                        }}
                        onClose={() => setShowQRScanner(false)}
                    />
                ) : (
                    <Select
                        name="assetId"
                        value={selectedAsset}
                        onValueChange={setSelectedAsset}
                    >
                        <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select an asset to verify" />
                        </SelectTrigger>
                        <SelectContent>
                            {assets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{asset.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {asset.serialNumber && `SN: ${asset.serialNumber} • `}
                                            {asset.category.name} • {asset.state.name}, {asset.lga.name}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Verification Details Section */}
            <div className="space-y-6 border rounded-lg p-6 bg-card">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Verification Details
                </h3>

                {/* Physical Condition */}
                <div className="space-y-3">
                    <Label htmlFor="physicalCondition" className="text-sm font-medium">
                        Physical Condition <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        name="physicalCondition"
                        value={condition}
                        onValueChange={setCondition}
                        required
                    >
                        <SelectTrigger className={`h-11 ${condition ? getConditionColor(condition) : ''}`}>
                            <SelectValue placeholder="Assess physical condition" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EXCELLENT">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-success" />
                                    <span><strong>Excellent</strong> - Like new, no visible wear</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="GOOD">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span><strong>Good</strong> - Minor wear, fully functional</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="FAIR">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-warning" />
                                    <span><strong>Fair</strong> - Visible wear, still functional</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="POOR">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                    <span><strong>Poor</strong> - Significant wear, limited function</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="DAMAGED">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                    <span><strong>Damaged</strong> - Needs immediate repair</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="MISSING">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                                    <span><strong>Missing</strong> - Asset not found</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Location Verification with GPS */}
                <div className="space-y-3">
                    <Label htmlFor="locationAccurate" className="text-sm font-medium">
                        Location Verification <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-col gap-2">
                        <Select
                            name="locationAccurate"
                            value={locationAccurate}
                            onValueChange={setLocationAccurate}
                            required
                        >
                            <SelectTrigger className={`h-11 ${locationAccurate === 'true' ? 'border-success text-success' :
                                locationAccurate === 'false' ? 'border-destructive text-destructive' : ''
                                }`}>
                                <SelectValue placeholder="Verify location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-success" />
                                        <span>Location is accurate</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="false">
                                    <div className="flex items-center gap-2">
                                        <X className="w-4 h-4 text-destructive" />
                                        <span>Location mismatch detected</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* GPS Location - Use LocationCapture Component */}
                        <LocationCapture
                            onLocationCapture={(location) => {
                                setLocationData(location);
                            }}
                            autoCapture={false}
                            required={false}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                    <Label htmlFor="notes" className="text-sm font-medium">
                        Verification Notes
                    </Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Record observations, issues, or additional details..."
                        className="min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        {notes.length}/500 characters
                    </p>
                </div>

                {/* Photo Upload */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">
                        Photo Evidence
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
                        <input
                            type="file"
                            id="photos"
                            name="photos"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                        <label htmlFor="photos" className="flex flex-col items-center gap-2 cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium">Upload Photos</p>
                            <p className="text-xs text-muted-foreground">
                                Click to add up to 5 photos (max 5MB each)
                            </p>
                        </label>
                    </div>

                    {/* Photo Previews */}
                    {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {photoPreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full aspect-square object-cover rounded-lg border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-950/20">
                <Label className="text-sm font-semibold mb-4 block">
                    Automatic Actions
                </Label>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="createMaintenance"
                            name="createMaintenance"
                            checked={createMaintenance}
                            onCheckedChange={(checked: boolean) => setCreateMaintenance(checked)}
                            disabled={condition !== 'DAMAGED'}
                        />
                        <div className="flex-1">
                            <label htmlFor="createMaintenance" className="text-sm font-medium cursor-pointer">
                                Create maintenance request if damaged
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Automatically creates a maintenance ticket for damaged assets
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="createDiscrepancy"
                            name="createDiscrepancy"
                            checked={createDiscrepancy}
                            onCheckedChange={(checked: boolean) => setCreateDiscrepancy(checked)}
                            disabled={locationAccurate === 'true' && !['POOR', 'DAMAGED'].includes(condition)}
                        />
                        <div className="flex-1">
                            <label htmlFor="createDiscrepancy" className="text-sm font-medium cursor-pointer">
                                Report discrepancy for issues
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Creates a discrepancy report for location or condition mismatches
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="min-w-[150px]">
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Submit Verification
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
