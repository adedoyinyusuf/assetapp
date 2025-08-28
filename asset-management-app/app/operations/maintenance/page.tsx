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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faWrench, faCalendar, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { getAssets, Asset } from '@/app/actions'

interface MaintenanceRecord {
  id: number
  asset_id: number
  asset_name: string
  maintenance_type: string
  scheduled_date: string
  completed_date?: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue'
  cost: number
  technician: string
  description: string
  notes?: string
  next_maintenance?: string
}

export default function MaintenancePage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: '',
    scheduled_date: '',
    cost: '',
    technician: '',
    description: '',
    notes: '',
    next_maintenance: ''
  })

  // Mock data for demonstration
  const mockMaintenanceRecords: MaintenanceRecord[] = [
    {
      id: 1,
      asset_id: 1,
      asset_name: 'Office Building A',
      maintenance_type: 'Preventive',
      scheduled_date: '2024-01-15',
      completed_date: '2024-01-15',
      status: 'Completed',
      cost: 5000,
      technician: 'John Doe',
      description: 'Annual HVAC system maintenance',
      notes: 'All systems functioning properly',
      next_maintenance: '2025-01-15'
    },
    {
      id: 2,
      asset_id: 2,
      asset_name: 'Generator Unit 1',
      maintenance_type: 'Corrective',
      scheduled_date: '2024-02-01',
      status: 'In Progress',
      cost: 2500,
      technician: 'Jane Smith',
      description: 'Engine oil leak repair',
      notes: 'Parts ordered, waiting for delivery'
    },
    {
      id: 3,
      asset_id: 3,
      asset_name: 'Vehicle Fleet 001',
      maintenance_type: 'Preventive',
      scheduled_date: '2024-01-20',
      status: 'Overdue',
      cost: 800,
      technician: 'Mike Johnson',
      description: 'Regular service and oil change',
      next_maintenance: '2024-04-20'
    }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assetsData = await getAssets()
        setAssets(assetsData)
        // In a real app, this would fetch from the backend
        setMaintenanceRecords(mockMaintenanceRecords)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const asset = assets.find(a => a.id === parseInt(formData.asset_id))
      
      const newRecord: MaintenanceRecord = {
        id: maintenanceRecords.length + 1,
        asset_id: parseInt(formData.asset_id),
        asset_name: asset?.name || '',
        maintenance_type: formData.maintenance_type,
        scheduled_date: formData.scheduled_date,
        status: 'Scheduled',
        cost: parseFloat(formData.cost),
        technician: formData.technician,
        description: formData.description,
        notes: formData.notes,
        next_maintenance: formData.next_maintenance
      }

      setMaintenanceRecords(prev => [newRecord, ...prev])
      
      // Reset form
      setFormData({
        asset_id: '',
        maintenance_type: '',
        scheduled_date: '',
        cost: '',
        technician: '',
        description: '',
        notes: '',
        next_maintenance: ''
      })
      
      setShowForm(false)
      alert('Maintenance record created successfully!')
    } catch (error) {
      console.error('Error creating maintenance record:', error)
      alert('Error creating maintenance record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = (id: number, status: MaintenanceRecord['status']) => {
    setMaintenanceRecords(prev => 
      prev.map(record => 
        record.id === id 
          ? { 
              ...record, 
              status, 
              completed_date: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined 
            }
          : record
      )
    )
  }

  const getStatusBadge = (status: MaintenanceRecord['status']) => {
    const variants = {
      'Scheduled': 'secondary',
      'In Progress': 'default',
      'Completed': 'default',
      'Overdue': 'destructive'
    } as const

    const icons = {
      'Scheduled': faCalendar,
      'In Progress': faWrench,
      'Completed': faCheckCircle,
      'Overdue': faExclamationTriangle
    }

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <FontAwesomeIcon icon={icons[status]} className="w-3 h-3" />
        {status}
      </Badge>
    )
  }

  const filteredRecords = filterStatus && filterStatus !== 'all'
    ? maintenanceRecords.filter(record => record.status === filterStatus)
    : maintenanceRecords

  const upcomingMaintenance = maintenanceRecords.filter(record => 
    record.status === 'Scheduled' && 
    new Date(record.scheduled_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )

  const overdueMaintenance = maintenanceRecords.filter(record => record.status === 'Overdue')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Maintenance</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{maintenanceRecords.length}</p>
              </div>
              <FontAwesomeIcon icon={faWrench} className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming (7 days)</p>
                <p className="text-2xl font-bold text-yellow-600">{upcomingMaintenance.length}</p>
              </div>
              <FontAwesomeIcon icon={faCalendar} className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueMaintenance.length}</p>
              </div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost (YTD)</p>
                <p className="text-2xl font-bold">${maintenanceRecords.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset">Asset *</Label>
                  <Select value={formData.asset_id} onValueChange={(value) => handleInputChange('asset_id', value)}>
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
                  <Label htmlFor="maintenanceType">Maintenance Type *</Label>
                  <Select value={formData.maintenance_type} onValueChange={(value) => handleInputChange('maintenance_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preventive">Preventive</SelectItem>
                      <SelectItem value="Corrective">Corrective</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Estimated Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="technician">Assigned Technician</Label>
                  <Input
                    id="technician"
                    value={formData.technician}
                    onChange={(e) => handleInputChange('technician', e.target.value)}
                    placeholder="Technician name"
                  />
                </div>

                <div>
                  <Label htmlFor="nextMaintenance">Next Maintenance Date</Label>
                  <Input
                    id="nextMaintenance"
                    type="date"
                    value={formData.next_maintenance}
                    onChange={(e) => handleInputChange('next_maintenance', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the maintenance work"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Schedule Maintenance'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Records */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Maintenance Records</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.asset_name}</TableCell>
                    <TableCell>{record.maintenance_type}</TableCell>
                    <TableCell>{new Date(record.scheduled_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>{record.technician}</TableCell>
                    <TableCell>${record.cost.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {record.status === 'Scheduled' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateStatus(record.id, 'In Progress')}
                          >
                            Start
                          </Button>
                        )}
                        {record.status === 'In Progress' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateStatus(record.id, 'Completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No maintenance records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
