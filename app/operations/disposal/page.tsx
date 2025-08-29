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
import { faPlus, faTrash, faFileAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { getAssets, Asset } from '@/app/actions'

interface DisposalRecord {
  id: number
  asset_id: number
  asset_name: string
  disposal_method: string
  disposal_date: string
  disposal_value: number
  reason: string
  approved_by: string
  disposal_company?: string
  certificate_number?: string
  status: 'Pending Approval' | 'Approved' | 'Disposed' | 'Cancelled'
  notes?: string
}

export default function DisposalPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    asset_id: '',
    disposal_method: '',
    disposal_date: '',
    disposal_value: '',
    reason: '',
    approved_by: '',
    disposal_company: '',
    certificate_number: '',
    notes: ''
  })

  // Mock data for demonstration
  const mockDisposalRecords: DisposalRecord[] = [
    {
      id: 1,
      asset_id: 1,
      asset_name: 'Old Computer System',
      disposal_method: 'Sale',
      disposal_date: '2024-01-15',
      disposal_value: 500,
      reason: 'End of useful life',
      approved_by: 'Director of Assets',
      disposal_company: 'Tech Recyclers Ltd',
      certificate_number: 'CERT-2024-001',
      status: 'Disposed',
      notes: 'Sold to certified e-waste recycler'
    },
    {
      id: 2,
      asset_id: 2,
      asset_name: 'Damaged Vehicle',
      disposal_method: 'Scrap',
      disposal_date: '2024-02-01',
      disposal_value: 0,
      reason: 'Accident damage beyond repair',
      approved_by: 'Fleet Manager',
      status: 'Approved',
      notes: 'Insurance claim processed'
    },
    {
      id: 3,
      asset_id: 3,
      asset_name: 'Obsolete Printer',
      disposal_method: 'Donation',
      disposal_date: '2024-02-15',
      disposal_value: 0,
      reason: 'Technology upgrade',
      approved_by: '',
      status: 'Pending Approval',
      notes: 'Proposed donation to local school'
    }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assetsData = await getAssets()
        setAssets(assetsData)
        // In a real app, this would fetch from the backend
        setDisposalRecords(mockDisposalRecords)
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
      
      const newRecord: DisposalRecord = {
        id: disposalRecords.length + 1,
        asset_id: parseInt(formData.asset_id),
        asset_name: asset?.name || '',
        disposal_method: formData.disposal_method,
        disposal_date: formData.disposal_date,
        disposal_value: parseFloat(formData.disposal_value || '0'),
        reason: formData.reason,
        approved_by: formData.approved_by,
        disposal_company: formData.disposal_company,
        certificate_number: formData.certificate_number,
        status: 'Pending Approval',
        notes: formData.notes
      }

      setDisposalRecords(prev => [newRecord, ...prev])
      
      // Reset form
      setFormData({
        asset_id: '',
        disposal_method: '',
        disposal_date: '',
        disposal_value: '',
        reason: '',
        approved_by: '',
        disposal_company: '',
        certificate_number: '',
        notes: ''
      })
      
      setShowForm(false)
      alert('Disposal request submitted successfully!')
    } catch (error) {
      console.error('Error creating disposal record:', error)
      alert('Error creating disposal record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = (id: number, status: DisposalRecord['status']) => {
    setDisposalRecords(prev => 
      prev.map(record => 
        record.id === id ? { ...record, status } : record
      )
    )
  }

  const getStatusBadge = (status: DisposalRecord['status']) => {
    const variants = {
      'Pending Approval': 'secondary',
      'Approved': 'default',
      'Disposed': 'default',
      'Cancelled': 'destructive'
    } as const

    const colors = {
      'Pending Approval': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Disposed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    )
  }

  const filteredRecords = filterStatus && filterStatus !== 'all'
    ? disposalRecords.filter(record => record.status === filterStatus)
    : disposalRecords

  const pendingApproval = disposalRecords.filter(record => record.status === 'Pending Approval')
  const totalDisposalValue = disposalRecords
    .filter(record => record.status === 'Disposed')
    .reduce((sum, record) => sum + record.disposal_value, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Disposal</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Request Disposal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{disposalRecords.length}</p>
              </div>
              <FontAwesomeIcon icon={faFileAlt} className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApproval.length}</p>
              </div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assets Disposed</p>
                <p className="text-2xl font-bold text-green-600">
                  {disposalRecords.filter(r => r.status === 'Disposed').length}
                </p>
              </div>
              <FontAwesomeIcon icon={faTrash} className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recovery Value</p>
                <p className="text-2xl font-bold">${totalDisposalValue.toLocaleString()}</p>
              </div>
              <FontAwesomeIcon icon={faFileAlt} className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disposal Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Request Asset Disposal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset">Asset *</Label>
                  <Select value={formData.asset_id} onValueChange={(value) => handleInputChange('asset_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset for disposal" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.name} - {asset.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="disposalMethod">Disposal Method *</Label>
                  <Select value={formData.disposal_method} onValueChange={(value) => handleInputChange('disposal_method', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select disposal method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sale">Sale</SelectItem>
                      <SelectItem value="Auction">Auction</SelectItem>
                      <SelectItem value="Scrap">Scrap</SelectItem>
                      <SelectItem value="Donation">Donation</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Destruction">Destruction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="disposalDate">Proposed Disposal Date *</Label>
                  <Input
                    id="disposalDate"
                    type="date"
                    value={formData.disposal_date}
                    onChange={(e) => handleInputChange('disposal_date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="disposalValue">Expected Recovery Value ($)</Label>
                  <Input
                    id="disposalValue"
                    type="number"
                    value={formData.disposal_value}
                    onChange={(e) => handleInputChange('disposal_value', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Disposal *</Label>
                  <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="End of useful life">End of useful life</SelectItem>
                      <SelectItem value="Obsolete technology">Obsolete technology</SelectItem>
                      <SelectItem value="Beyond economic repair">Beyond economic repair</SelectItem>
                      <SelectItem value="Accident damage">Accident damage</SelectItem>
                      <SelectItem value="Surplus to requirements">Surplus to requirements</SelectItem>
                      <SelectItem value="Safety concerns">Safety concerns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="approvedBy">Approved By</Label>
                  <Input
                    id="approvedBy"
                    value={formData.approved_by}
                    onChange={(e) => handleInputChange('approved_by', e.target.value)}
                    placeholder="Approving authority"
                  />
                </div>

                <div>
                  <Label htmlFor="disposalCompany">Disposal Company</Label>
                  <Input
                    id="disposalCompany"
                    value={formData.disposal_company}
                    onChange={(e) => handleInputChange('disposal_company', e.target.value)}
                    placeholder="Company handling disposal"
                  />
                </div>

                <div>
                  <Label htmlFor="certificateNumber">Certificate Number</Label>
                  <Input
                    id="certificateNumber"
                    value={formData.certificate_number}
                    onChange={(e) => handleInputChange('certificate_number', e.target.value)}
                    placeholder="Disposal certificate reference"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information about the disposal"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Disposal Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Disposal Records */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Disposal Records</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Disposed">Disposed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.asset_name}</TableCell>
                    <TableCell>{record.disposal_method}</TableCell>
                    <TableCell>{new Date(record.disposal_date).toLocaleDateString()}</TableCell>
                    <TableCell>${record.disposal_value.toLocaleString()}</TableCell>
                    <TableCell>{record.reason}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {record.status === 'Pending Approval' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateStatus(record.id, 'Approved')}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateStatus(record.id, 'Cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {record.status === 'Approved' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateStatus(record.id, 'Disposed')}
                          >
                            Mark Disposed
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
              No disposal records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
