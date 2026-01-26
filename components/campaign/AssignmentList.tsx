'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, Mail, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
    id: number;
    userId: number;
    role: string;
    status: string;
    assignedAt: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: {
            name: string;
        };
    };
    verificationCount?: number;
}

interface AssignmentListProps {
    assignments: Assignment[];
    onRemove: (assignmentId: number) => void;
    isRemoving: boolean;
}

const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case 'TEAM_LEAD':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'VERIFIER':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'REVIEWER':
            return 'bg-green-100 text-green-700 border-green-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export function AssignmentList({ assignments, onRemove, isRemoving }: AssignmentListProps) {
    if (assignments.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">No Team Members Assigned</h3>
                <p className="text-sm text-muted-foreground">
                    Click &quot;Add Team Member&quot; to assign verifiers to this campaign
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Team Member</TableHead>
                        <TableHead>Assignment Role</TableHead>
                        <TableHead>System Role</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead className="text-center">Verifications</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            {getInitials(assignment.user.firstName, assignment.user.lastName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {assignment.user.firstName} {assignment.user.lastName}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {assignment.user.email}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={getRoleBadgeColor(assignment.role)}>
                                    {assignment.role.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                    {assignment.user.role.name}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-muted-foreground">
                                    {format(new Date(assignment.assignedAt), 'MMM d, yyyy')}
                                </span>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className="font-mono font-semibold">
                                    {assignment.verificationCount || 0}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemove(assignment.id)}
                                    disabled={isRemoving}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
