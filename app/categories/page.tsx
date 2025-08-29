'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryManager } from '@/components/CategoryManager';
import { Category, getCategories, addCategory } from '@/app/actions';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = await addCategory(newCategoryName);
      if (newCategory) {
        setCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Asset Categories</h1>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <Input
            type="text"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-64"
          />
          <Button type="submit" className="bg-primary text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Category
          </Button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Category Hierarchy</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <CategoryManager />
          )}
        </div>
      </div>
    </div>
  );
}
