'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons'
import { getCategories, addCategory, updateCategory, deleteCategory, Category } from '@/app/actions'

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    
    setLoading(true)
    try {
      await addCategory(newCategoryName)
      setNewCategoryName('')
      setShowAddForm(false)
      await fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = async (id: number) => {
    if (!editCategoryName.trim()) return
    
    setLoading(true)
    try {
      await updateCategory(id, editCategoryName)
      setEditingId(null)
      setEditCategoryName('')
      await fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      setLoading(true)
      try {
        await deleteCategory(id)
        await fetchCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditCategoryName(category.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditCategoryName('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <Button onClick={handleAddCategory} disabled={loading}>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {loading ? 'Adding...' : 'Add Category'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>
                      {editingId === category.id ? (
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <span className="font-medium">{category.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === category.id ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleEditCategory(category.id)}
                              disabled={loading}
                            >
                              <FontAwesomeIcon icon={faSave} className="mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={cancelEdit}
                            >
                              <FontAwesomeIcon icon={faTimes} className="mr-1" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => startEdit(category)}
                            >
                              <FontAwesomeIcon icon={faEdit} className="mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              disabled={loading}
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found. Add your first category to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
