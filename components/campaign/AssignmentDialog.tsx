'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Loader2 } from 'lucide-react';

interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: {
        name: string;
    };
}

interface AssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignId: number;
    users: User[];
    onAssign: (userId: number, role: string) => Promise<void>;
}

const assignmentRoles = [
    { value: 'TEAM_LEAD', label: 'Team Lead', description: 'Manages team and reviews verifications' },
    { value: 'VERIFIER', label: 'Verifier', description: 'Conducts asset verifications' },
    { value: 'REVIEWER', label: 'Reviewer', description: 'Reviews and approves verifications' }
];

export function AssignmentDialog({ open, onOpenChange, campaignId, users, onAssign }: AssignmentDialogProps) {
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('VERIFIER');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAssign = async () => {
        if (!selectedUser) return;

        setIsSubmitting(true);
        try {
            await onAssign(parseInt(selectedUser), selectedRole);
            setSelectedUser('');
            setSelectedRole('VERIFIER');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to assign user:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Assign Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Add a team member to this verification campaign
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* User Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="user">Team Member</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger id="user">
                                <SelectValue placeholder="Select a team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {user.firstName} {user.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                            <Badge variant="outline" className="ml-auto text-xs">
                                                {user.role.name}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Assignment Role</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {assignmentRoles.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{role.label}</span>
                                            <span className="text-xs text-muted-foreground">{role.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Role Info */}
                    {selectedRole && (
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                {assignmentRoles.find(r => r.value === selectedRole)?.description}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedUser || isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Member
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
