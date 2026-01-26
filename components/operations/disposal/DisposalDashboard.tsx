'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { createDisposalRequest, approveDisposalRequest, rejectDisposalRequest, cancelDisposalRequest, finalizeDisposal } from '@/app/operations/disposal/actions';
import { toast } from 'sonner';

interface DisposalDashboardProps {
    requests: any[];
    assets: any[];
}

export function DisposalDashboard({ requests, assets }: DisposalDashboardProps) {
    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null); // For finalization
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await createDisposalRequest(formData);
            toast.success('Disposal request created');
            setShowForm(false);
        } catch (error) {
            toast.error('Failed to create request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAction = async (action: (fd: FormData) => Promise<void>, requestId: number, successMessage: string) => {
        const formData = new FormData();
        formData.append('requestId', requestId.toString());

        try {
            await action(formData);
            toast.success(successMessage);
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleFinalize = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await finalizeDisposal(formData);
            toast.success('Asset disposed successfully');
            setSelectedRequest(null);
        } catch (error) {
            toast.error('Failed to finalize disposal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRecords = filterStatus && filterStatus !== 'all'
        ? requests.filter(r => r.status === filterStatus)
        : requests;

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const disposedCount = requests.filter(r => r.status === 'COMPLETED').length;
    // Calculate total value if we had record info in requests, but for now we might need to rely on what's available

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            'PENDING': 'secondary',
            'APPROVED': 'default',
            'COMPLETED': 'outline', // Or distinct color
            'REJECTED': 'destructive',
            'CANCELLED': 'destructive'
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Asset Disposal</h1>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Request Disposal
                </Button>
            </div>

            {/* Summary Cards */}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="pt-6 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                        </div>
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                    <CardContent className="pt-6 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                        </div>
                        <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="pt-6 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Disposed Assets</p>
                            <p className="text-2xl font-bold text-green-700">{disposedCount}</p>
                        </div>
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create Request Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Asset Disposal</DialogTitle>
                        <DialogDescription>Submit a request to dispose of an asset.</DialogDescription>
                    </DialogHeader>
                    <form action={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Asset</Label>
                            <Select name="assetId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assets.map(asset => (
                                        <SelectItem key={asset.id} value={asset.id.toString()}>
                                            {asset.name} ({asset.serialNumber || 'No SN'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Select name="reason" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OBSOLETE">Obsolete</SelectItem>
                                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                                    <SelectItem value="LOST">Lost</SelectItem>
                                    <SelectItem value="SOLD">Sold</SelectItem>
                                    <SelectItem value="DONATED">Donated</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea name="description" placeholder="Details about condition etc." />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>Submit Request</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Finalize Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalize Disposal</DialogTitle>
                        <DialogDescription>
                            Confirm disposal details. This will remove the asset from active inventory.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <form action={handleFinalize} className="space-y-4">
                            <input type="hidden" name="requestId" value={selectedRequest.id} />
                            <input type="hidden" name="assetId" value={selectedRequest.assetId} />

                            <div className="space-y-2">
                                <Label>Disposal Method</Label>
                                <Select name="method" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AUCTION">Auction</SelectItem>
                                        <SelectItem value="SCRAP">Scrap</SelectItem>
                                        <SelectItem value="DONATION">Donation</SelectItem>
                                        <SelectItem value="RETURN_TO_VENDOR">Return to Vendor</SelectItem>
                                        <SelectItem value="DESTROYED">Destroyed</SelectItem>
                                        <SelectItem value="SOLD">Sold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Proceeds Amount (₦)</Label>
                                <Input type="number" name="proceeds" min="0" defaultValue="0" />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea name="notes" placeholder="Final disposal notes..." />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                                <Button type="submit" variant="destructive" disabled={isSubmitting}>Confirm Disposal</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Records List */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Disposal Requests</CardTitle>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Asset</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.asset.name}</div>
                                        <div className="text-xs text-muted-foreground">{req.asset.serialNumber}</div>
                                    </TableCell>
                                    <TableCell>{req.reason}</TableCell>
                                    <TableCell>{req.requester.firstName} {req.requester.lastName}</TableCell>
                                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <Button size="sm" onClick={() => handleAction(approveDisposalRequest, req.id, "Approved")}>Approve</Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleAction(rejectDisposalRequest, req.id, "Rejected")}>Reject</Button>
                                                </>
                                            )}
                                            {req.status === 'APPROVED' && (
                                                <Button size="sm" variant="default" onClick={() => setSelectedRequest(req)}>Execute Disposal</Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRecords.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
