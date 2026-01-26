'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { receivePurchaseOrderItems } from '@/app/procurement/actions';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface ReceiveItemsModalProps {
    po: {
        id: number;
        poNumber: string;
        items: any[];
    };
    states: any[];
    lgas: any[];
}

export function ReceiveItemsModal({ po, states, lgas }: ReceiveItemsModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track receiving state per item
    const [receivingState, setReceivingState] = useState<Record<number, {
        quantity: number;
        serialNumbers: string;
        stateId: string;
        lgaId: string;
    }>>({});

    const handleReceiveChange = (itemId: number, field: string, value: any) => {
        setReceivingState(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId] || { quantity: 0, serialNumbers: '', stateId: '', lgaId: '' },
                [field]: value
            }
        }));
    };

    const handleReceiveAll = (item: any) => {
        const remaining = item.quantity - (item.receivedQuantity || 0);
        handleReceiveChange(item.id, 'quantity', remaining);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Build payload
            const itemsPayload = Object.entries(receivingState)
                .filter(([_, data]) => data.quantity > 0)
                .map(([itemId, data]) => ({
                    itemId: Number(itemId),
                    quantityReceived: Number(data.quantity),
                    stateId: Number(data.stateId),
                    lgaId: Number(data.lgaId),
                    serialNumbers: data.serialNumbers ? data.serialNumbers.split(',').map(s => s.trim()).filter(Boolean) : undefined
                }));

            if (itemsPayload.length === 0) {
                toast.error("Please enter quantity to receive for at least one item");
                setIsSubmitting(false);
                return;
            }

            // Check location selection
            const invalidItem = itemsPayload.find(i => !i.stateId || !i.lgaId);
            if (invalidItem) {
                toast.error("Please select State and LGA for all received items");
                setIsSubmitting(false);
                return;
            }

            const formData = new FormData();
            formData.append('items', JSON.stringify(itemsPayload));

            await receivePurchaseOrderItems(po.id, formData);

            toast.success("Items received successfully");
            setOpen(false);
            setReceivingState({});
        } catch (error) {
            toast.error("Failed to receive items");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Receive Items</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Receive Items - {po.poNumber}</DialogTitle>
                    <DialogDescription>
                        Confirm receipt of items and assign to a location.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {po.items.map(item => {
                        const remaining = item.quantity - (item.receivedQuantity || 0);
                        if (remaining <= 0) return null; // Fully received

                        const currentState = receivingState[item.id] || { quantity: 0, serialNumbers: '', stateId: '', lgaId: '' };
                        const filteredLgas = lgas.filter(l => l.stateId === Number(currentState.stateId));

                        return (
                            <div key={item.id} className="border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{item.itemName}</h4>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p>Ordered: {item.quantity}</p>
                                        <p>Received: {item.receivedQuantity || 0}</p>
                                        <p className="font-medium text-primary">Remaining: {remaining}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Quantity to Receive</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max={remaining}
                                                value={currentState.quantity}
                                                onChange={(e) => handleReceiveChange(item.id, 'quantity', Number(e.target.value))}
                                            />
                                            <Button variant="outline" size="sm" onClick={() => handleReceiveAll(item)}>
                                                All
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Serial Numbers (Comma separated)</Label>
                                        <Input
                                            placeholder="SN001, SN002..."
                                            value={currentState.serialNumbers}
                                            onChange={(e) => handleReceiveChange(item.id, 'serialNumbers', e.target.value)}
                                            disabled={currentState.quantity === 0}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Destination State</Label>
                                        <Select
                                            value={currentState.stateId}
                                            onValueChange={(val) => handleReceiveChange(item.id, 'stateId', val)}
                                            disabled={currentState.quantity === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Destination LGA</Label>
                                        <Select
                                            value={currentState.lgaId}
                                            onValueChange={(val) => handleReceiveChange(item.id, 'lgaId', val)}
                                            disabled={!currentState.stateId || currentState.quantity === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select LGA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredLgas.map(l => (
                                                    <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {po.items.every(i => (i.quantity - (i.receivedQuantity || 0)) <= 0) && (
                        <p className="text-center text-muted-foreground">All items have been fully received.</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Confirm Receipt'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
