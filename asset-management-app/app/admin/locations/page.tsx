'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMapMarkerAlt, faBuilding } from '@fortawesome/free-solid-svg-icons'
import { getStates, getLGAs, State, LGA, initializeLocations } from '@/lib/locationsApi'

export default function LocationsManagementPage() {
  const [states, setStates] = useState<State[]>([])
  const [selectedState, setSelectedState] = useState<string>('')
  const [lgas, setLgas] = useState<LGA[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)

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

  const handleInitializeLocations = async () => {
    if (!confirm('This will initialize all Nigerian states and Sokoto LGAs. Continue?')) return
    setInitializing(true)
    try {
      const result = await initializeLocations()
      alert(result.message || 'Locations initialized successfully')
      await fetchStates()
    } catch (error) {
      console.error('Error initializing locations:', error)
      alert('Failed to initialize locations')
    } finally {
      setInitializing(false)
    }
  }

  const selectedStateName = states.find(s => s.id === parseInt(selectedState || '0'))?.name || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Locations Management</h1>
        <Button variant="outline" onClick={handleInitializeLocations} disabled={initializing}>
          {initializing ? 'Initializing...' : 'Initialize Locations'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total States</p>
                <p className="text-2xl font-bold">{states.length}</p>
              </div>
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selected State LGAs</p>
                <p className="text-2xl font-bold">{lgas.length}</p>
              </div>
              <FontAwesomeIcon icon={faBuilding} className="h-8 w-8 text-green-600" />
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
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-8 w-8 text-purple-600" />
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedState(state.id.toString())}
                      >
                        View LGAs
                      </Button>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lgas.map((lga) => (
                        <TableRow key={lga.id}>
                          <TableCell>{lga.id}</TableCell>
                          <TableCell className="font-medium">{lga.name}</TableCell>
                          <TableCell>{selectedStateName}</TableCell>
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
    </div>
  )
}
