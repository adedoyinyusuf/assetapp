'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { getAssets, getStates, getLGAs, getAssetMovements, addAssetMovement, Asset, State, LGA, AssetMovement } from '@/app/actions'

export default function AssetMovementsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [states, setStates] = useState<State[]>([])
  const [fromLgas, setFromLgas] = useState<LGA[]>([])
  const [toLgas, setToLgas] = useState<LGA[]>([])
  const [movements, setMovements] = useState<AssetMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    asset_id: '',
    from_state_id: '',
    from_lga_id: '',
    to_state_id: '',
    to_lga_id: '',
    movement_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    moved_by: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsData, statesData, movementsData] = await Promise.all([
          getAssets(),
          getStates(),
          getAssetMovements()
        ])
        setAssets(assetsData)
        setStates(statesData)
        setMovements(movementsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.from_state_id) {
      getLGAs(parseInt(formData.from_state_id)).then(setFromLgas)
    }
  }, [formData.from_state_id])

  useEffect(() => {
    if (formData.to_state_id) {
      getLGAs(parseInt(formData.to_state_id)).then(setToLgas)
    }
  }, [formData.to_state_id])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Find names for the movement record
      const asset = assets.find(a => a.id === parseInt(formData.asset_id))
      const fromState = states.find(s => s.id === parseInt(formData.from_state_id))
      const toState = states.find(s => s.id === parseInt(formData.to_state_id))
      const fromLga = fromLgas.find(l => l.id === parseInt(formData.from_lga_id))
      const toLga = toLgas.find(l => l.id === parseInt(formData.to_lga_id))

      const movementData = {
        asset_id: parseInt(formData.asset_id),
        from_state_id: parseInt(formData.from_state_id),
        from_lga_id: parseInt(formData.from_lga_id),
        to_state_id: parseInt(formData.to_state_id),
        to_lga_id: parseInt(formData.to_lga_id),
        movement_date: formData.movement_date,
        reason: formData.reason,
        notes: formData.notes,
        moved_by: formData.moved_by,
        // Include names for display
        asset_name: asset?.name || '',
        from_state: fromState?.name || '',
        from_lga: fromLga?.name || '',
        to_state: toState?.name || '',
        to_lga: toLga?.name || ''
      }

      await addAssetMovement(movementData)
      
      // Refresh movements list
      const updatedMovements = await getAssetMovements()
      setMovements(updatedMovements)
      
      // Reset form
      setFormData({
        asset_id: '',
        from_state_id: '',
        from_lga_id: '',
        to_state_id: '',
        to_lga_id: '',
        movement_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
        moved_by: ''
      })
      
      setShowForm(false)
      alert('Asset movement recorded successfully!')
    } catch (error) {
      console.error('Error recording movement:', error)
      alert('Error recording movement. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Movements</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Record New Movement
        </Button>
      </div>

      {/* Movement Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record Asset Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Selection */}
                <div className="md:col-span-2">
                  <Label htmlFor="asset">Asset *</Label>
                  <Select value={formData.asset_id} onValueChange={(value) => handleInputChange('asset_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset to move" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.name} - {asset.state?.name}, {asset.lga?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* From Location */}
                <div>
                  <Label htmlFor="fromState">From State *</Label>
                  <Select value={formData.from_state_id} onValueChange={(value) => handleInputChange('from_state_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select current state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fromLga">From LGA *</Label>
                  <Select value={formData.from_lga_id} onValueChange={(value) => handleInputChange('from_lga_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select current LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {fromLgas.map((lga) => (
                        <SelectItem key={lga.id} value={lga.id.toString()}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* To Location */}
                <div>
                  <Label htmlFor="toState">To State *</Label>
                  <Select value={formData.to_state_id} onValueChange={(value) => handleInputChange('to_state_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="toLga">To LGA *</Label>
                  <Select value={formData.to_lga_id} onValueChange={(value) => handleInputChange('to_lga_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {toLgas.map((lga) => (
                        <SelectItem key={lga.id} value={lga.id.toString()}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Movement Details */}
                <div>
                  <Label htmlFor="movementDate">Movement Date *</Label>
                  <Input
                    id="movementDate"
                    type="date"
                    value={formData.movement_date}
                    onChange={(e) => handleInputChange('movement_date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="movedBy">Moved By</Label>
                  <Input
                    id="movedBy"
                    value={formData.moved_by}
                    onChange={(e) => handleInputChange('moved_by', e.target.value)}
                    placeholder="Person responsible for movement"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="reason">Reason for Movement</Label>
                  <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Relocation">Relocation</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Upgrade">Upgrade</SelectItem>
                      <SelectItem value="Redistribution">Redistribution</SelectItem>
                      <SelectItem value="Storage">Storage</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information about the movement"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Movement'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Movement History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
            Movement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>From Location</TableHead>
                  <TableHead>To Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Moved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">{movement.asset_name}</TableCell>
                    <TableCell>{movement.from_state}, {movement.from_lga}</TableCell>
                    <TableCell>{movement.to_state}, {movement.to_lga}</TableCell>
                    <TableCell>{new Date(movement.movement_date).toLocaleDateString()}</TableCell>
                    <TableCell>{movement.reason}</TableCell>
                    <TableCell>{movement.moved_by || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {movements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No asset movements recorded yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
