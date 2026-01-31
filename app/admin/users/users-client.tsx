'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, User as UserIcon, Shield, Users } from 'lucide-react'
import { toast } from 'sonner'
import { createUser, updateUser, deleteUser } from '@/app/actions/user-actions'

// Interfaces matching the Server Component data pass
export interface User {
    id: number
    email: string
    firstName: string | null
    lastName: string | null
    role: string
    roleId: number | null
    isActive: boolean
    lastLogin: string | null
    permissions: string[]
    createdAt: string
    updatedAt: string
}

export interface Role {
    id: number;
    name: string;
    description: string | null;
}

interface UsersClientProps {
    initialUsers: User[]
    roles: Role[]
}

export default function UsersManagementClient({ initialUsers, roles }: UsersClientProps) {
    const router = useRouter()
    // Use props directly for the list to allow server refresh
    const users = initialUsers

    const [isPending, startTransition] = useTransition()
    const [showAddForm, setShowAddForm] = useState(false)
    const [filterRole, setFilterRole] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    const getUserDisplayName = (user: User) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        if (user.firstName) return user.firstName
        if (user.lastName) return user.lastName
        return user.email
    }

    const [newUser, setNewUser] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'VIEWER',
        isActive: true
    })

    const getRoleId = (roleName: string) => {
        const role = roles.find(r => r.name === roleName);
        return role ? role.id : null;
    };

    const handleAddUser = async () => {
        if (!newUser.firstName || !newUser.lastName || !newUser.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        const roleId = getRoleId(newUser.role) || 2;

        startTransition(async () => {
            const result = await createUser({
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                roleId: roleId,
                isActive: newUser.isActive,
            });

            if (result.success) {
                toast.success(result.message);
                setShowAddForm(false);
                setNewUser({
                    firstName: '',
                    lastName: '',
                    email: '',
                    role: 'VIEWER',
                    isActive: true
                });
                // Wait for router refresh to reflect changes
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to create user');
            }
        });
    }

    const handleDeleteUser = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            startTransition(async () => {
                const result = await deleteUser(id);
                if (result.success) {
                    toast.success(result.message);
                    router.refresh();
                } else {
                    toast.error(result.error || 'Failed to delete user');
                }
            });
        }
    }

    const toggleUserStatus = (id: number) => {
        // Find the user to get current status
        const user = users.find(u => u.id === id);
        if (!user) return;

        startTransition(async () => {
            const result = await updateUser({
                userId: id,
                isActive: !user.isActive
            });

            if (result.success) {
                toast.success(user.isActive ? 'User deactivated' : 'User activated');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update status');
            }
        });
    }

    const getRoleBadge = (role: string) => {
        const variants: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
            'SUPER_ADMIN': 'destructive',
            'ADMIN': 'destructive',
            'MANAGER': 'default',
            'OPERATOR': 'secondary',
            'VIEWER': 'outline',
            'AUDITOR': 'secondary',

            // Stock Roles
            'TEAM_LEADER': 'default',
            'SENIOR_VERIFIER': 'secondary',
            'VERIFIER': 'secondary',
            'ASSISTANT_VERIFIER': 'outline',
            'OBSERVER': 'outline',
            'QUALITY_CONTROLLER': 'destructive'
        }

        const formatRoleName = (name: string) => {
            return name.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
        };

        return <Badge variant={variants[role] || 'outline'}>{formatRoleName(role)}</Badge>
    }

    const getStatusBadge = (isActive: boolean) => {
        return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
            </Badge>
        )
    }

    const filteredUsers = users.filter(user => {
        if (filterRole && filterRole !== 'all' && user.role !== filterRole) return false
        if (filterStatus && filterStatus !== 'all') {
            const status = user.isActive ? 'Active' : 'Inactive'
            if (status !== filterStatus) return false
        }
        return true
    })

    const roleStats = {
        ADMIN: users.filter(u => u.role === 'ADMIN').length,
        MANAGER: users.filter(u => u.role === 'MANAGER').length,
        SUPER_ADMIN: users.filter(u => u.role === 'SUPER_ADMIN').length
    }

    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        roleId: 0,
        isActive: true
    })

    // Helper to visually group roles
    const getRoleGroups = (rolesList: Role[]) => {
        const assetRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER', 'AUDITOR'];
        const stockRoles = ['TEAM_LEADER', 'SENIOR_VERIFIER', 'VERIFIER', 'ASSISTANT_VERIFIER', 'QUALITY_CONTROLLER', 'OBSERVER'];

        const assetGroup = rolesList.filter(r => assetRoles.includes(r.name));
        const stockGroup = rolesList.filter(r => stockRoles.includes(r.name));
        const otherGroup = rolesList.filter(r => !assetRoles.includes(r.name) && !stockRoles.includes(r.name));

        return { assetGroup, stockGroup, otherGroup };
    };

    const { assetGroup, stockGroup, otherGroup } = getRoleGroups(roles);

    const renderRoleSelectItems = () => {
        if (roles.length === 0) return <SelectItem value="VIEWER">No Roles Available</SelectItem>;

        return (
            <>
                {assetGroup.length > 0 && (
                    <>
                        <SelectItem value="header_asset" disabled className="font-bold text-gray-900 bg-gray-50 opacity-100">Asset Management</SelectItem>
                        {assetGroup.map(role => (
                            <SelectItem key={role.id} value={role.name} className="pl-6">
                                {role.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                            </SelectItem>
                        ))}
                    </>
                )}

                {stockGroup.length > 0 && (
                    <>
                        <div className="h-px bg-gray-100 my-1" />
                        <SelectItem value="header_stock" disabled className="font-bold text-gray-900 bg-gray-50 opacity-100">Stock Verification</SelectItem>
                        {stockGroup.map(role => (
                            <SelectItem key={role.id} value={role.name} className="pl-6">
                                {role.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                            </SelectItem>
                        ))}
                    </>
                )}

                {otherGroup.length > 0 && (
                    <>
                        <div className="h-px bg-gray-100 my-1" />
                        <SelectItem value="header_other" disabled className="font-bold text-gray-900 bg-gray-50 opacity-100">Other Roles</SelectItem>
                        {otherGroup.map(role => (
                            <SelectItem key={role.id} value={role.name} className="pl-6">
                                {role.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                            </SelectItem>
                        ))}
                    </>
                )}
            </>
        )
    }

    const handleEditClick = (user: User) => {
        setEditingUser(user)
        const foundRole = roles.find(r => r.name === user.role);
        setEditForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            roleId: user.roleId || (foundRole ? foundRole.id : 0),
            isActive: user.isActive
        })
        setShowEditDialog(true)
    }

    const handleUpdateUser = async () => {
        if (!editingUser) return

        startTransition(async () => {
            const result = await updateUser({
                userId: editingUser.id,
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                email: editForm.email,
                roleId: editForm.roleId,
                isActive: editForm.isActive
            });

            if (result.success) {
                toast.success(result.message);
                setShowEditDialog(false);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update user');
            }
        });

    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">User Management</h1>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold">{users.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
                            </div>
                            <UserIcon className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Admins</p>
                                <p className="text-2xl font-bold">{roleStats.ADMIN + roleStats.SUPER_ADMIN}</p>
                            </div>
                            <Shield className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Managers</p>
                                <p className="text-2xl font-bold">{roleStats.MANAGER}</p>
                            </div>
                            <Shield className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add User Form */}
            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="userFirstName">First Name</Label>
                                <Input
                                    id="userFirstName"
                                    value={newUser.firstName}
                                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="userLastName">Last Name</Label>
                                <Input
                                    id="userLastName"
                                    value={newUser.lastName}
                                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                    placeholder="Enter last name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="userEmail">Email Address</Label>
                                <Input
                                    id="userEmail"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@npc.gov.ng"
                                />
                            </div>
                            <div>
                                <Label htmlFor="userRole">Role</Label>
                                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renderRoleSelectItems()}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="userStatus">Status</Label>
                                <Select value={newUser.isActive ? 'Active' : 'Inactive'} onValueChange={(value) => setNewUser({ ...newUser, isActive: value === 'Active' })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <Button onClick={handleAddUser} disabled={isPending}>
                                {isPending ? 'Adding...' : 'Add User'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowAddForm(false)} disabled={isPending}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit User Dialog */}
            {showEditDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader>
                            <CardTitle>Edit User</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="editFirstName">First Name</Label>
                                        <Input
                                            id="editFirstName"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editLastName">Last Name</Label>
                                        <Input
                                            id="editLastName"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editEmail">Email</Label>
                                    <Input
                                        id="editEmail"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editRole">Role</Label>
                                    <Select
                                        value={String(editForm.roleId)}
                                        onValueChange={(value) => setEditForm({ ...editForm, roleId: Number(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={String(role.id)}>
                                                    {role.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editStatus">Status</Label>
                                    <Select
                                        value={editForm.isActive ? 'true' : 'false'}
                                        onValueChange={(value) => setEditForm({ ...editForm, isActive: value === 'true' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Active</SelectItem>
                                            <SelectItem value="false">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isPending}>Cancel</Button>
                                <Button onClick={handleUpdateUser} disabled={isPending}>
                                    {isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Users ({filteredUsers.length})</CardTitle>
                        <div className="flex gap-4">
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.name}>
                                            {role.name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{getUserDisplayName(user)}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                                        <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                                        <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditClick(user)}
                                                >
                                                    <Edit className="mr-1 h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={user.isActive ? 'secondary' : 'default'}
                                                    onClick={() => toggleUserStatus(user.id)}
                                                >
                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    <Trash2 className="mr-1 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
