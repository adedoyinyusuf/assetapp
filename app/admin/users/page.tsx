'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faUser, faUserShield, faUsers } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'sonner'

interface User {
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

interface UsersResponse {
  data: User[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.data)
        setPagination(data.pagination)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error loading users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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
    role: 'USER',
    isActive: true
  })

  const handleAddUser = () => {
    // TODO: Implement API call to add user
    toast.info('Add user functionality will be implemented')
  }

  const handleDeleteUser = (id: number) => {
    // TODO: Implement API call to delete user
    if (confirm('Are you sure you want to delete this user?')) {
      toast.info('Delete user functionality will be implemented')
    }
  }

  const toggleUserStatus = (id: number) => {
    // TODO: Implement API call to toggle user status
    toast.info('Toggle user status functionality will be implemented')
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
      'SUPER_ADMIN': 'destructive',
      'ADMIN': 'destructive', 
      'MANAGER': 'default',
      'OPERATOR': 'secondary',
      'VIEWER': 'outline'
    }

    const displayNames: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Admin',
      'MANAGER': 'Manager', 
      'OPERATOR': 'Operator',
      'VIEWER': 'Viewer'
    }

    return <Badge variant={variants[role] || 'outline'}>{displayNames[role] || role}</Badge>
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
    OPERATOR: users.filter(u => u.role === 'OPERATOR').length,
    VIEWER: users.filter(u => u.role === 'VIEWER').length,
    SUPER_ADMIN: users.filter(u => u.role === 'SUPER_ADMIN').length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
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
              <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-600" />
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
              <FontAwesomeIcon icon={faUser} className="h-8 w-8 text-green-600" />
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
              <FontAwesomeIcon icon={faUserShield} className="h-8 w-8 text-red-600" />
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
              <FontAwesomeIcon icon={faUserShield} className="h-8 w-8 text-purple-600" />
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
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="userLastName">Last Name</Label>
                <Input
                  id="userLastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@npc.gov.ng"
                />
              </div>
              <div>
                <Label htmlFor="userRole">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="OPERATOR">Operator</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userStatus">Status</Label>
                <Select value={newUser.isActive ? 'Active' : 'Inactive'} onValueChange={(value) => setNewUser({...newUser, isActive: value === 'Active'})}>
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
              <Button onClick={handleAddUser}>Add User</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
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
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
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
                        <Button size="sm" variant="outline">
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
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
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
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
