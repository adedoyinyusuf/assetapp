'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addAssetMovement, getStates, getLGAs, State, LGA } from '@/app/client-actions'
import { ArrowRightLeft } from 'lucide-react'

interface AssetMovementFormProps {
  assetId: number
  currentLocation?: string  // Made optional since it's not critical for functionality
  currentStateId?: number
  currentLgaId?: number
  categoryName?: string
}

export default function AssetMovementForm({
  assetId,
  currentStateId,
  currentLgaId,
  categoryName
}: AssetMovementFormProps) {
  const [states, setStates] = useState<State[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [fromStateId, setFromStateId] = useState<number | ''>('')
  const [fromLgaId, setFromLgaId] = useState<number | ''>('')
  const [toStateId, setToStateId] = useState<number | ''>('')
  const [toLgaId, setToLgaId] = useState<number | ''>('')
  const [moveDate, setMoveDate] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  // Load states on component mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        const statesData = await getStates()
        setStates(statesData)

        // Set current location if available
        if (currentStateId) {
          setFromStateId(currentStateId)
          if (currentLgaId) {
            const lgasData = await getLGAs(currentStateId)
            setLgas(lgasData)
            setFromLgaId(currentLgaId)
          }
        }
      } catch (err) {
        console.error('Error loading location data:', err)
        setError('Failed to load location data. Please try again.')
      }
    }

    loadStates()
  }, [currentStateId, currentLgaId])

  // Load LGAs when from state changes
  const handleFromStateChange = async (stateId: string) => {
    const id = parseInt(stateId)
    setFromStateId(id)
    setFromLgaId('')

    if (id) {
      try {
        const lgasData = await getLGAs(id)
        setLgas(lgasData)
      } catch (err) {
        console.error('Error loading LGAs:', err)
        setError('Failed to load LGAs. Please try again.')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form
    if (!fromStateId || !fromLgaId || !toStateId || !toLgaId || !moveDate || !reason) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      await addAssetMovement({
        asset_id: assetId,
        from_state_id: fromStateId as number,
        from_lga_id: fromLgaId as number,
        to_state_id: toStateId as number,
        to_lga_id: toLgaId as number,
        movement_date: moveDate,
        reason,
        notes: notes || undefined,
        moved_by: 'System User' // In a real app, this would be the logged-in user
      })

      // Reset form
      setToStateId('')
      setToLgaId('')
      setMoveDate('')
      setReason('')
      setNotes('')

      // Refresh the page to show the new movement
      router.refresh()
    } catch (err) {
      console.error('Error recording movement:', err)
      setError('Failed to record movement. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow mt-4">
      <h3 className="text-xl font-semibold mb-4">Record Asset Movement</h3>

      {categoryName && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-700">Asset Category: <span className="font-normal">{categoryName}</span></p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* From Location */}
        <div className="space-y-4 p-4 border rounded-md">
          <h4 className="font-medium">From Location</h4>

          <div>
            <Label htmlFor="fromState">State *</Label>
            <Select
              value={fromStateId ? fromStateId.toString() : ''}
              onValueChange={handleFromStateChange}
              disabled={!!currentStateId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select state" />
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
            <Label htmlFor="fromLga">LGA *</Label>
            <Select
              value={fromLgaId ? fromLgaId.toString() : ''}
              onValueChange={(value) => setFromLgaId(parseInt(value))}
              disabled={!fromStateId || !!currentLgaId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select LGA" />
              </SelectTrigger>
              <SelectContent>
                {lgas.map((lga) => (
                  <SelectItem key={lga.id} value={lga.id.toString()}>
                    {lga.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* To Location */}
        <div className="space-y-4 p-4 border rounded-md">
          <h4 className="font-medium">To Location</h4>

          <div>
            <Label htmlFor="toState">State *</Label>
            <Select
              value={toStateId ? toStateId.toString() : ''}
              onValueChange={async (value) => {
                const id = parseInt(value)
                setToStateId(id)
                setToLgaId('')

                if (id) {
                  try {
                    const lgasData = await getLGAs(id)
                    setLgas(lgasData)
                  } catch (err) {
                    console.error('Error loading LGAs:', err)
                    setError('Failed to load LGAs. Please try again.')
                  }
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select state" />
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
            <Label htmlFor="toLga">LGA *</Label>
            <Select
              value={toLgaId ? toLgaId.toString() : ''}
              onValueChange={(value) => setToLgaId(parseInt(value))}
              disabled={!toStateId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select LGA" />
              </SelectTrigger>
              <SelectContent>
                {lgas.map((lga) => (
                  <SelectItem key={lga.id} value={lga.id.toString()}>
                    {lga.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="moveDate">Movement Date *</Label>
          <Input
            id="moveDate"
            type="datetime-local"
            value={moveDate}
            onChange={(e) => setMoveDate(e.target.value)}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="reason">Reason for Movement *</Label>
          <Select
            value={reason}
            onValueChange={setReason}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Transfer">Transfer</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Repair">Repair</SelectItem>
              <SelectItem value="Disposal">Disposal</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1"
          placeholder="Any additional information about this movement..."
          rows={3}
        />
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={isLoading}
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          {isLoading ? 'Recording...' : 'Record Movement'}
        </Button>
      </div>
    </form>
  )
}
