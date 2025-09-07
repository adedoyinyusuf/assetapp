'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'sonner'

interface Category {
  id: number;
  name: string;
  description?: string;
  defaultUsefulLifeYears?: number;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export default function CategoriesManagementPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')

  // Debug logging
  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
    console.log('User role:', session?.user?.role)
  }, [session, status])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.statusText);
        toast.error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error loading categories');
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: ''
        }),
      });
      
      if (response.ok) {
        toast.success('Category added successfully');
        setNewCategoryName('');
        setShowAddForm(false);
        await fetchCategories();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Error adding category');
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = async (id: number) => {
    if (!editCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCategoryName,
        }),
      });
      
      if (response.ok) {
        toast.success('Category updated successfully');
        setEditingId(null);
        setEditCategoryName('');
        await fetchCategories();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Error updating category');
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      setLoading(true)
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          toast.success('Category deleted successfully');
          await fetchCategories();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to delete category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Error deleting category');
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
        <Button 
          onClick={() => {
            console.log('Add Category button clicked, current showAddForm:', showAddForm)
            console.log('Session:', session)
            setShowAddForm(!showAddForm)
          }}
        >
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
