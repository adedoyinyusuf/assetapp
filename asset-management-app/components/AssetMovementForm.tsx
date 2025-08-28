'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addAssetMovement } from '@/app/actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons'

interface AssetMovementFormProps {
  assetId: number
  currentLocation: string
}

export default function AssetMovementForm({ assetId, currentLocation }: AssetMovementFormProps) {
  const [fromLocation, setFromLocation] = useState(currentLocation)
  const [toLocation, setToLocation] = useState('')
  const [moveDate, setMoveDate] = useState('')
  const [notes, setNotes] = useState('')

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addAssetMovement({
      asset_id: assetId,
      asset_name: '',
      from_state_id: 1,
      from_lga_id: 1,
      to_state_id: 1,
      to_lga_id: 1,
      from_state: fromLocation.split(',')[0] || '',
      from_lga: fromLocation.split(',')[1] || '',
      to_state: toLocation.split(',')[0] || '',
      to_lga: toLocation.split(',')[1] || '',
      movement_date: moveDate,
      reason: 'Manual Entry',
      notes,
      moved_by: 'System User'
    })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow mt-4">
      <h3 className="text-xl font-semibold mb-4">Record Asset Movement</h3>
      <div>
        <Label htmlFor="fromLocation">From Location</Label>
        <Input
          id="fromLocation"
          value={fromLocation}
          onChange={(e) => setFromLocation(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="toLocation">To Location</Label>
        <Input
          id="toLocation"
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="moveDate">Move Date</Label>
        <Input
          id="moveDate"
          type="date"
          value={moveDate}
          onChange={(e) => setMoveDate(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit">
        <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
        Record Movement
      </Button>
    </form>
  )
}

