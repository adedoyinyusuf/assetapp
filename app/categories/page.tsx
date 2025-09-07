'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { CategoryManager } from '@/components/CategoryManager';
import { toast } from 'sonner';
import { UserRole } from '@/lib/auth/roles';

interface Category {
  id: number;
  name: string;
  description?: string;
  defaultUsefulLifeYears: number;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch categories function
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    if (session) {
      fetchCategories();
    }
  }, [session]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Category added successfully!');
        setNewCategoryName('');
        setNewCategoryDescription('');
        fetchCategories(); // Refresh the categories list
      } else {
        toast.error(data.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to add categories
  const userRole = session?.user?.role as string;
  
  // Debug role information
  console.log('Current user role:', userRole, typeof userRole);
  console.log('UserRole.SUPER_ADMIN:', UserRole.SUPER_ADMIN);
  console.log('UserRole.ADMIN:', UserRole.ADMIN);
  console.log('Available UserRoles:', Object.values(UserRole));
  
  // Handle different role formats and normalize comparison
  const normalizedUserRole = userRole?.toUpperCase();
  const canAddCategory = normalizedUserRole === 'SUPER_ADMIN' || 
                        normalizedUserRole === 'SUPERADMIN' || 
                        normalizedUserRole === 'ADMIN' ||
                        userRole === UserRole.SUPER_ADMIN || 
                        userRole === UserRole.ADMIN;
  
  console.log('Can add category:', canAddCategory, 'Normalized role:', normalizedUserRole);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage asset categories for better organization
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchCategories}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Add Category Form */}
      {/* Show form if user can add category OR if we can't determine permissions but user is logged in */}
      {(canAddCategory || (session && !userRole)) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Enter category description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary text-white"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Permission Message */}
      {!canAddCategory && session && userRole && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 mb-6" role="alert">
          <p>You need Administrator privileges to add new categories.</p>
          <p className="text-sm mt-2">Current role: {userRole}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Existing Categories ({categories.length})</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600 mb-4">
                {canAddCategory 
                  ? "Get started by adding your first category above."
                  : "No categories have been created yet."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span>ID: {category.id}</span>
                        {category.created_at && (
                          <span className="ml-4">
                            Created: {new Date(category.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
