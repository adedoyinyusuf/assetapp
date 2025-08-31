'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, MapPin, Building, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getStates, getLGAs, State, LGA, initializeLocations } from '@/lib/locationsApi'

// State for State management
interface StateFormData {
  id?: number;
  name: string;
}

// State for LGA management
interface LGAFormData {
  id?: number;
  name: string;
  state_id: number;
}

export default function LocationsManagementPage() {
  // States and LGAs data
  const [states, setStates] = useState<State[]>([])
  const [selectedState, setSelectedState] = useState<string>('')
  const [lgas, setLgas] = useState<LGA[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  // Form states
  const [stateForm, setStateForm] = useState<StateFormData>({ name: '' })
  const [lgaForm, setLgaForm] = useState<LGAFormData>({ name: '', state_id: 0 })
  
  // UI states
  const [submitting, setSubmitting] = useState(false)
  const [stateDialogOpen, setStateDialogOpen] = useState(false)
  const [lgaDialogOpen, setLgaDialogOpen] = useState(false)

  useEffect(() => {
    fetchStates()
  }, [])

  useEffect(() => {
    if (selectedState && selectedState !== 'all') {
      fetchLGAs(parseInt(selectedState))
    } else {
      setLgas([])
    }
  }, [selectedState])

  const fetchStates = async () => {
    try {
      const data = await getStates()
      setStates(data)
    } catch (error) {
      console.error('Error fetching states:', error)
    }
  }

  const fetchLGAs = async (stateId: number) => {
    setLoading(true)
    try {
      const data = await getLGAs(stateId)
      setLgas(data)
    } catch (error) {
      console.error('Error fetching LGAs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Form submission handlers
  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch('/api/locations/states', {
        method: stateForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateForm)
      })
      
      if (!response.ok) {
        throw new Error(await response.text())
      }
      
      toast.success(`State ${stateForm.id ? 'updated' : 'added'} successfully`)
      setStateDialogOpen(false)
      await fetchStates()
    } catch (error: any) {
      console.error('Error saving state:', error)
      toast.error(error.message || 'Failed to save state')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleDeleteState = async (id: number) => {
    if (!confirm('Are you sure you want to delete this state? This will also delete all associated LGAs.')) return
    
    try {
      const response = await fetch(`/api/states/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await response.text())
      
      toast.success('State deleted successfully')
      await fetchStates()
      if (parseInt(selectedState) === id) {
        setSelectedState('')
        setLgas([])
      }
    } catch (error: any) {
      console.error('Error deleting state:', error)
      toast.error(error.message || 'Failed to delete state')
    }
  }
  
  // LGA Management Functions
  const handleLGASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedState) {
      toast.error('Please select a state first')
      return
    }
    
    setSubmitting(true)
    
    try {
      const stateId = parseInt(selectedState)
      const url = lgaForm.id 
        ? `/api/states/${stateId}/lgas/${lgaForm.id}`
        : `/api/states/${stateId}/lgas`
      const method = lgaForm.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: lgaForm.name,
          state_id: stateId
        })
      })
      
      if (!response.ok) {
        throw new Error(await response.text())
      }
      
      toast.success(`LGA ${lgaForm.id ? 'updated' : 'added'} successfully`)
      setLgaDialogOpen(false)
      await fetchLGAs(stateId)
    } catch (error: any) {
      console.error('Error saving LGA:', error)
      toast.error(error.message || 'Failed to save LGA')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleDeleteLGA = async (id: number) => {
    if (!confirm('Are you sure you want to delete this LGA?')) return
    
    try {
      const response = await fetch(`/api/lgas/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await response.text())
      
      toast.success('LGA deleted successfully')
      if (selectedState) {
        await fetchLGAs(parseInt(selectedState))
      }
    } catch (error: any) {
      console.error('Error deleting LGA:', error)
      toast.error(error.message || 'Failed to delete LGA')
    }
  }
  
  const handleInitializeLocations = async () => {
    if (!confirm('This will initialize all Nigerian states and LGAs. Continue?')) return
    setInitializing(true)
    try {
      const result = await initializeLocations()
      toast.success(result.message || 'Locations initialized successfully')
      await fetchStates()
    } catch (error: any) {
      console.error('Error initializing locations:', error)
      toast.error(error.message || 'Failed to initialize locations')
    } finally {
      setInitializing(false)
    }
  }
  
  // Dialog control functions
  const openStateDialog = (state?: State) => {
    setStateForm(state ? { id: state.id, name: state.name } : { name: '' })
    setStateDialogOpen(true)
  }
  
  const openLGADialog = (lga?: LGA) => {
    setLgaForm(lga ? { 
      id: lga.id, 
      name: lga.name, 
      state_id: lga.state_id 
    } : { 
      name: '', 
      state_id: selectedState ? parseInt(selectedState) : 0 
    })
    setLgaDialogOpen(true)
  }

  const selectedStateName = states.find(s => s.id === parseInt(selectedState || '0'))?.name || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations Management</h1>
          <p className="text-muted-foreground">Manage states and local government areas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInitializeLocations} disabled={initializing}>
            {initializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : 'Initialize Locations'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total States</p>
                <p className="text-2xl font-bold">{states.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected State LGAs</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : lgas.length}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total LGAs</p>
                <p className="text-2xl font-bold">774</p>
                <p className="text-xs text-gray-500">Across Nigeria</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => openStateDialog()}>
                    <Plus className="h-4 w-4 mr-1" /> Add State
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openLGADialog()}
                    disabled={!selectedState || selectedState === 'all'}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add LGA
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* States Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nigerian States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>State Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {states.map((state) => (
                  <TableRow key={state.id}>
                    <TableCell>{state.id}</TableCell>
                    <TableCell className="font-medium">{state.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openStateDialog(state)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteState(state.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* LGA Selection and Display */}
      <Card>
        <CardHeader>
          <CardTitle>Local Government Areas (LGAs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="stateSelect">Select State to View LGAs</Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.id.toString()}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedState && selectedState !== 'all' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                LGAs in {selectedStateName} ({lgas.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8">Loading LGAs...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>LGA Name</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lgas.map((lga) => (
                        <TableRow key={lga.id}>
                          <TableCell>{lga.id}</TableCell>
                          <TableCell className="font-medium">{lga.name}</TableCell>
                          <TableCell>{selectedStateName}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => openLGADialog(lga)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteLGA(lga.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {selectedState === 'all' && (
            <div className="text-center py-8 text-gray-500">
              Select a specific state to view its Local Government Areas.
            </div>
          )}

          {!selectedState && (
            <div className="text-center py-8 text-gray-500">
              Select a state from the dropdown above to view its LGAs.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">About Nigerian Administrative Divisions</h4>
              <p className="text-sm text-gray-600 mt-2">
                Nigeria is divided into 36 states and the Federal Capital Territory (FCT), Abuja. 
                Each state is further subdivided into Local Government Areas (LGAs), totaling 774 LGAs across the country.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">Asset Location Tracking</h4>
              <p className="text-sm text-gray-600 mt-2">
                This system tracks assets by their specific state and LGA locations, providing 
                precise geographic accountability for all National Population Commission assets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* State Form Dialog */}
      <Dialog open={stateDialogOpen} onOpenChange={setStateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{stateForm.id ? 'Edit' : 'Add New'} State</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="stateName">State Name</Label>
              <Input
                id="stateName"
                value={stateForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStateForm({...stateForm, name: e.target.value})}
                placeholder="Enter state name"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save State'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LGA Form Dialog */}
      <Dialog open={lgaDialogOpen} onOpenChange={setLgaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lgaForm.id ? 'Edit' : 'Add New'} LGA</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLGASubmit} className="space-y-4">
            <div>
              <Label htmlFor="lgaName">LGA Name</Label>
              <Input
                id="lgaName"
                value={lgaForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLgaForm({...lgaForm, name: e.target.value})}
                placeholder="Enter LGA name"
                required
              />
            </div>
            <div>
              <Label htmlFor="lgaState">State</Label>
              <Select
                value={lgaForm.state_id?.toString() || ''}
                onValueChange={(value: string) => setLgaForm({...lgaForm, state_id: parseInt(value)})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLgaDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  lgaForm.id ? 'Update LGA' : 'Add LGA'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
