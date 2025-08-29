'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faUser, faUserShield, faUsers } from '@fortawesome/free-solid-svg-icons'

interface User {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Manager' | 'User' | 'Viewer'
  status: 'Active' | 'Inactive'
  lastLogin: string
  createdAt: string
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@npc.gov.ng',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-01-25',
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@npc.gov.ng',
      role: 'Manager',
      status: 'Active',
      lastLogin: '2024-01-24',
      createdAt: '2024-01-05'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@npc.gov.ng',
      role: 'User',
      status: 'Inactive',
      lastLogin: '2024-01-20',
      createdAt: '2024-01-10'
    }
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'User' as User['role'],
    status: 'Active' as User['status']
  })

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return

    const user: User = {
      id: users.length + 1,
      ...newUser,
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0]
    }

    setUsers([...users, user])
    setNewUser({ name: '', email: '', role: 'User', status: 'Active' })
    setShowAddForm(false)
  }

  const handleDeleteUser = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== id))
    }
  }

  const toggleUserStatus = (id: number) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
        : user
    ))
  }

  const getRoleBadge = (role: User['role']) => {
    const variants = {
      'Admin': 'destructive',
      'Manager': 'default',
      'User': 'secondary',
      'Viewer': 'outline'
    } as const

    return <Badge variant={variants[role]}>{role}</Badge>
  }

  const getStatusBadge = (status: User['status']) => {
    return (
      <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    )
  }

  const filteredUsers = users.filter(user => {
    if (filterRole && filterRole !== 'all' && user.role !== filterRole) return false
    if (filterStatus && filterStatus !== 'all' && user.status !== filterStatus) return false
    return true
  })

  const roleStats = {
    Admin: users.filter(u => u.role === 'Admin').length,
    Manager: users.filter(u => u.role === 'Manager').length,
    User: users.filter(u => u.role === 'User').length,
    Viewer: users.filter(u => u.role === 'Viewer').length
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
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'Active').length}</p>
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
                <p className="text-2xl font-bold">{roleStats.Admin}</p>
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
                <p className="text-2xl font-bold">{roleStats.Manager}</p>
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
                <Label htmlFor="userName">Full Name</Label>
                <Input
                  id="userName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Enter full name"
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
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as User['role']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userStatus">Status</Label>
                <Select value={newUser.status} onValueChange={(value) => setNewUser({...newUser, status: value as User['status']})}>
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
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant={user.status === 'Active' ? 'secondary' : 'default'}
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
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
