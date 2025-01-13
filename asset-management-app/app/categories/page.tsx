'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/app/actions'
import { Category } from '@/app/actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faSave } from '@fortawesome/free-solid-svg-icons'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const fetchedCategories = await getCategories()
      setCategories(fetchedCategories)
    }
    fetchCategories()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newCategoryName.trim()) {
      const newCategory = await addCategory(newCategoryName.trim())
      setCategories([...categories, newCategory])
      setNewCategoryName('')
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCategory && editingCategory.name.trim()) {
      await updateCategory(editingCategory.id, editingCategory.name.trim())
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? editingCategory : cat
      ))
      setEditingCategory(null)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(id)
      setCategories(categories.filter(cat => cat.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Category Management</h1>
      
      <form onSubmit={handleAddCategory} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Add New Category</h2>
        <div>
          <Label htmlFor="newCategoryName">Category Name</Label>
          <Input
            id="newCategoryName"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
          />
        </div>
        <Button type="submit">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Category
        </Button>
      </form>
      
      <div className="space-y-4 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Existing Categories</h2>
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-2 border-b">
            {editingCategory && editingCategory.id === category.id ? (
              <form onSubmit={handleUpdateCategory} className="flex-1 flex items-center">
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="mr-2"
                />
                <Button type="submit" size="sm">
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Save
                </Button>
              </form>
            ) : (
              <>
                <span>{category.name}</span>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingCategory(category)}
                    className="mr-2"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

