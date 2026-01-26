'use client';

import { useState } from 'react';
import { assignAssetCustody, releaseAssetCustody, searchUsers } from '@/app/assets/custody-actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User as UserIcon, X, Search, UserPlus, UserMinus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
}

interface CustodyModalProps {
    assetId: number;
    currentCustodian?: User | null;
}

export function CustodyAssignmentModal({ assetId, currentCustodian }: CustodyModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length >= 2) {
            const results = await searchUsers(query);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleAssign = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await assignAssetCustody(assetId, selectedUser.id, notes);
            if (res.success) {
                toast.success(`Asset assigned to ${selectedUser.firstName}`);
                setIsOpen(false);
                setSelectedUser(null);
                setNotes('');
            } else {
                toast.error("Failed to assign asset");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleRelease = async () => {
        if (!confirm("Are you sure you want to release this asset back to store?")) return;
        setLoading(true);
        try {
            const res = await releaseAssetCustody(assetId);
            if (res.success) {
                toast.success("Asset released returning to store");
                setIsOpen(false);
            } else {
                toast.error("Failed to release asset");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    {currentCustodian ? (
                        <>
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <span>Assigned: {currentCustodian.firstName} {currentCustodian.lastName}</span>
                        </>
                    ) : (
                        <>
                            <UserPlus className="h-4 w-4" />
                            <span>Assign Custody</span>
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Evaluate Custody</DialogTitle>
                    <DialogDescription>
                        Manage who is currently responsible for this asset.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* Current Custodian Display */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Custodian</Label>
                        {currentCustodian ? (
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={currentCustodian.image || ''} />
                                        <AvatarFallback>{currentCustodian.firstName?.[0]}{currentCustodian.lastName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{currentCustodian.firstName} {currentCustodian.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{currentCustodian.email}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleRelease} disabled={loading} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Release
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-2 text-sm text-yellow-600 flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Not currently assigned (In Store)
                            </div>
                        )}
                    </div>

                    {/* Assignment Form */}
                    <div className="space-y-3">
                        <Label>Assign New Custodian</Label>
                        {!selectedUser ? (
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {searchResults.map(user => (
                                            <div
                                                key={user.id}
                                                className="p-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                                                onClick={() => handleSelectUser(user)}
                                            >
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-[10px]">{user.firstName?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="text-sm">
                                                    <p>{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border rounded-md bg-green-50/50 border-green-100">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{selectedUser.firstName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {selectedUser && (
                        <div className="space-y-2">
                            <Label>Assignment Notes (Optional)</Label>
                            <Input
                                placeholder="Condition, reason, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedUser || loading}>
                        {loading ? 'Processing...' : 'Confirm Assignment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
