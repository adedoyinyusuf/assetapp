'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, MapPin, Trash2, Wrench } from 'lucide-react';
import { resolveDiscrepancy } from '@/app/stock-verification/actions';
import { toast } from 'sonner';

interface DiscrepancyResolutionModalProps {
    discrepancyId: number;
    currentStatus: string;
    assetName: string;
    trigger?: React.ReactNode;
}

export function DiscrepancyResolutionModal({
    discrepancyId,
    currentStatus,
    assetName,
    trigger
}: DiscrepancyResolutionModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<string>('resolve'); // 'resolve', 'update_loc', 'repair', 'dispose'
    const [notes, setNotes] = useState('');
    const router = useRouter();

    const handleResolve = async () => {
        if (!notes) {
            toast.error('Resolution notes are required');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('discrepancyId', discrepancyId.toString());
            formData.append('resolutionNotes', notes);

            // Map UI actions to backend actions
            let backendAction = '';
            if (action === 'update_loc') backendAction = 'UPDATE_ASSET_LOCATION'; // Note: This needs state/LGA picking in a real app, assuming correction for now
            if (action === 'repair') backendAction = 'MARK_AS_DAMAGED';
            if (action === 'dispose') backendAction = 'DISPOSE_ASSET';

            formData.append('action', backendAction ? 'resolve_with_update' : 'resolve');
            if (backendAction) formData.append('resolutionAction', backendAction);

            await resolveDiscrepancy(formData);

            toast.success('Discrepancy resolved successfully');
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error('Failed to resolve discrepancy');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Resolve</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Resolve Discrepancy</DialogTitle>
                    <DialogDescription>
                        Take action on the discrepancy for asset: <span className="font-semibold">{assetName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Resolution Action</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={action === 'resolve' ? 'default' : 'outline'}
                                className="justify-start"
                                onClick={() => setAction('resolve')}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Resolve Only
                            </Button>
                            <Button
                                variant={action === 'repair' ? 'default' : 'outline'}
                                className="justify-start"
                                onClick={() => setAction('repair')}
                            >
                                <Wrench className="mr-2 h-4 w-4" />
                                Mark for Repair
                            </Button>
                            <Button
                                variant={action === 'dispose' ? 'destructive' : 'outline'}
                                className="justify-start"
                                onClick={() => setAction('dispose')}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Dispose Asset
                            </Button>
                            {/* Location update would require state/LGA selectors, simplifying for now */}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Resolution Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Explain how this discrepancy was resolved..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {action === 'dispose' && (
                        <div className="flex items-center p-3 text-amber-600 bg-amber-50 rounded-md text-sm">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            This will permanently mark the asset as DISPOSED.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleResolve} disabled={loading} variant={action === 'dispose' ? 'destructive' : 'default'}>
                        {loading ? 'Processing...' : 'Confirm Resolution'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
