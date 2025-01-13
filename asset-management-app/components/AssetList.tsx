'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faEye } from '@fortawesome/free-solid-svg-icons'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteAsset, Asset } from '@/app/actions'

interface AssetListProps {
  initialAssets: Asset[]
}

export default function AssetList({ initialAssets }: AssetListProps) {
  const [assets, setAssets] = useState(initialAssets)
  const router = useRouter()

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(id)
        setAssets(assets.filter(asset => asset.id !== id))
        router.refresh()
      } catch (error) {
        console.error('Error deleting asset:', error)
        // Handle error (e.g., show error message to user)
      }
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Purchase Value</TableHead>
          <TableHead>Purchase Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell>{asset.name}</TableCell>
            <TableCell>{asset.category}</TableCell>
            <TableCell>${asset.purchaseValue.toFixed(2)}</TableCell>
            <TableCell>{asset.purchaseDate}</TableCell>
            <TableCell>{`${asset.state}, ${asset.lga}`}</TableCell>
            <TableCell className="space-x-2">
              <Link href={`/assets/${asset.id}`}>
                <Button variant="outline" size="sm">
                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                  View
                </Button>
              </Link>
              <Link href={`/assets/edit/${asset.id}`}>
                <Button variant="outline" size="sm">
                  <FontAwesomeIcon icon={faEdit} className="mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(asset.id)}>
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

