'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCampaign } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, Target, Calendar, DollarSign, MapPin, Layers, FileText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mobileOptimized, animations } from '@/lib/ui-utils';

interface State {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

interface CampaignFormProps {
    states: State[];
    categories: Category[];
}

export default function CampaignForm({ states, categories }: CampaignFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [instructions, setInstructions] = useState('');
    const [selectedStates, setSelectedStates] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [assetCount, setAssetCount] = useState<number>(0);
    const [isLoadingCount, setIsLoadingCount] = useState(false);

    // Calculate estimated asset count when scope changes
    useEffect(() => {
        const calculateAssetCount = async () => {
            if (selectedStates.length === 0 && selectedCategories.length === 0) {
                setAssetCount(0);
                return;
            }

            setIsLoadingCount(true);
            try {
                const params = new URLSearchParams();
                selectedStates.forEach(id => params.append('stateIds', id.toString()));
                selectedCategories.forEach(id => params.append('categoryIds', id.toString()));

                const response = await fetch(`/api/assets/count?${params}`);
                if (response.ok) {
                    const data = await response.json();
                    setAssetCount(data.count || 0);
                }
            } catch (err) {
                console.error('Failed to fetch asset count:', err);
            } finally {
                setIsLoadingCount(false);
            }
        };

        const timer = setTimeout(calculateAssetCount, 300);
        return () => clearTimeout(timer);
    }, [selectedStates, selectedCategories]);

    // Form validation
    const validateForm = (): boolean => {
        if (!name.trim()) {
            setError('Campaign name is required');
            return false;
        }
        if (!startDate) {
            setError('Start date is required');
            return false;
        }
        if (!endDate) {
            setError('End date is required');
            return false;
        }
        if (new Date(endDate) <= new Date(startDate)) {
            setError('End date must be after start date');
            return false;
        }
        if (selectedStates.length === 0) {
            setError('Please select at least one state');
            return false;
        }
        return true;
    };

    // Handle state selection
    const toggleState = (stateId: number) => {
        setSelectedStates(prev =>
            prev.includes(stateId)
                ? prev.filter(id => id !== stateId)
                : [...prev, stateId]
        );
    };

    // Handle category selection
    const toggleCategory = (categoryId: number) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Calculate campaign duration
    const getDuration = () => {
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('budget', budget);
        formData.append('instructions', instructions);
        selectedStates.forEach(id => formData.append('assignedStates', id.toString()));
        selectedCategories.forEach(id => formData.append('assignedCategories', id.toString()));

        startTransition(async () => {
            try {
                await createCampaign(formData);
                setSuccess(true);
                setTimeout(() => router.push('/stock-verification/campaigns'), 1500);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create campaign');
            }
        });
    };

    // Success state
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4 animate-scale-in">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Campaign Created!</h3>
                <p className="text-muted-foreground mb-4">Redirecting to campaigns list...</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    const duration = getDuration();

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Campaign Stats Preview */}
            {(assetCount > 0 || duration) && (
                <Card className={`bg-primary/5 border-primary/20`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Campaign Overview</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {duration && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="text-lg font-semibold">{duration} days</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground">States</p>
                                <p className="text-lg font-semibold">{selectedStates.length}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Categories</p>
                                <p className="text-lg font-semibold">
                                    {selectedCategories.length || 'All'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Est. Assets</p>
                                <p className="text-lg font-semibold flex items-center gap-2">
                                    {isLoadingCount ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        assetCount.toLocaleString()
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Basic Information */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                    </div>

                    {/* Campaign Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-base">
                            Campaign Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Q1 2026 State Asset Verification"
                            className="h-11"
                            maxLength={255}
                            required
                        />
                        <p className="text-xs text-muted-foreground">{name.length}/255 characters</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the purpose and scope of this campaign..."
                            className="min-h-[100px] resize-none"
                            maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground">{description.length}/2000 characters</p>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline & Budget */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Timeline & Budget</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-base">
                                Start Date <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="h-11"
                                required
                            />
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-base">
                                End Date <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || new Date().toISOString().split('T')[0]}
                                className="h-11"
                                required
                            />
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                        <Label htmlFor="budget" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Budget (₦)</span>
                        </Label>
                        <Input
                            type="number"
                            id="budget"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">Optional - Specify budget for the campaign</p>
                    </div>
                </CardContent>
            </Card>

            {/* Geographic Scope */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Geographic Scope</h3>
                        <Badge variant="outline" className="ml-auto">
                            {selectedStates.length} selected
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base">
                            States <span className="text-destructive">*</span>
                        </Label>
                        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4 ${mobileOptimized.scrollable}`}>
                            {states.map((state) => (
                                <div key={state.id} className="flex items-start gap-2">
                                    <Checkbox
                                        id={`state-${state.id}`}
                                        checked={selectedStates.includes(state.id)}
                                        onCheckedChange={() => toggleState(state.id)}
                                    />
                                    <label
                                        htmlFor={`state-${state.id}`}
                                        className={`text-sm font-medium cursor-pointer ${mobileOptimized.touchTarget}`}
                                    >
                                        {state.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {selectedStates.length === 0 && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Select at least one state to continue
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Asset Categories */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Asset Categories</h3>
                        <Badge variant="outline" className="ml-auto">
                            {selectedCategories.length || 'All'} selected
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base">
                            Categories <span className="text-muted-foreground text-sm">(optional - leave empty for all)</span>
                        </Label>
                        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4 ${mobileOptimized.scrollable}`}>
                            {categories.map((category) => (
                                <div key={category.id} className="flex items-start gap-2">
                                    <Checkbox
                                        id={`category-${category.id}`}
                                        checked={selectedCategories.includes(category.id)}
                                        onCheckedChange={() => toggleCategory(category.id)}
                                    />
                                    <label
                                        htmlFor={`category-${category.id}`}
                                        className={`text-sm font-medium cursor-pointer ${mobileOptimized.touchTarget}`}
                                    >
                                        {category.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Team Instructions</h3>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructions">Special Instructions for Verifiers</Label>
                        <Textarea
                            id="instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Provide detailed instructions for team members during verification..."
                            className="min-h-[150px] resize-none"
                            maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground">{instructions.length}/2000 characters</p>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className={`flex gap-4 justify-end pt-6 border-t sticky bottom-0 bg-background pb-4 ${mobileOptimized.safeArea}`}>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isPending}
                    className={`min-w-[120px] ${mobileOptimized.touchTarget}`}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending || selectedStates.length === 0}
                    className={`min-w-[180px] ${mobileOptimized.touchTarget}`}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Campaign...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Create Campaign
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
