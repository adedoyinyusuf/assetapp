'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Wrench, Calendar, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { getAssets, Asset } from '@/app/actions'
import { toast } from 'sonner'
import { PermissionGate } from '@/components/PermissionGate'
import { UserRole } from '@/lib/auth/roles'

// Types matching API response
interface MaintenanceRequest {
  id: number
  assetId: number
  asset: { name: string }
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' | 'REJECTED'
  scheduledDate?: string // metadata
  createdAt: string
  workOrder?: WorkOrder
}

interface WorkOrder {
  id: number
  status: string
  assignedTo?: number
  startDate?: string
}

export default function MaintenancePage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  // Form data
  const [formData, setFormData] = useState({
    assetId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    scheduledDate: '',
  })

  // Fetch data
  const loadData = async () => {
    try {
      const [assetsData, requestsRes] = await Promise.all([
        getAssets(),
        fetch('/api/maintenance/requests')
      ])

      setAssets(assetsData)

      if (requestsRes.ok) {
        const requests = await requestsRes.json()
        setMaintenanceRecords(requests)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load maintenance data')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/maintenance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to create request')

      toast.success('Maintenance request created')
      setShowForm(false)
      loadData()

      // Reset form
      setFormData({
        assetId: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        scheduledDate: '',
      })
    } catch (error) {
      toast.error('Error creating request')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/maintenance/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!res.ok) throw new Error('Failed to update status')

      toast.success(`Status updated to ${status}`)
      loadData()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const convertToWorkOrder = async (request: MaintenanceRequest) => {
    try {
      const res = await fetch('/api/maintenance/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          assetId: request.assetId,
          title: request.title,
          description: request.description,
          priority: request.priority,
          startDate: request.scheduledDate
        })
      })

      if (!res.ok) throw new Error('Failed to create work order')

      toast.success('Work Order created')
      loadData() // Refresh to see updated status
    } catch (error) {
      toast.error('Failed to convert to work order')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'SCHEDULED': 'bg-gray-100 text-gray-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    }

    return (
      <Badge variant="outline" className={`${styles[status] || 'bg-gray-100'} border-0`}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const filteredRecords = filterStatus !== 'all'
    ? maintenanceRecords.filter(r => r.status === filterStatus)
    : maintenanceRecords

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Maintenance</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats Cards - Calculated from displayed records */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{maintenanceRecords.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {maintenanceRecords.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {maintenanceRecords.filter(r => r.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {maintenanceRecords.filter(r => r.priority === 'CRITICAL').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Maintenance Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset">Asset *</Label>
                  <Select value={formData.assetId} onValueChange={(value) => handleInputChange('assetId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="scheduledDate">Target Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Submit Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Request List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Maintenance Requests</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.asset?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <div>{record.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{record.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      record.priority === 'CRITICAL' ? 'text-red-600 border-red-200' :
                        record.priority === 'HIGH' ? 'text-orange-600 border-orange-200' : ''
                    }>
                      {record.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {record.status === 'PENDING' && (
                        <PermissionGate allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(record.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                        </PermissionGate>
                      )}
                      {record.status === 'APPROVED' && !record.workOrder && (
                        <PermissionGate allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => convertToWorkOrder(record)}
                          >
                            <Wrench className="w-3 h-3 mr-1" />
                            Work Order
                          </Button>
                        </PermissionGate>
                      )}
                      {record.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          className="bg-green-600"
                          onClick={() => updateStatus(record.id, 'COMPLETED')}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No maintenance requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
