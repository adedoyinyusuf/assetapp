'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { getCategories } from '@/app/client-actions';

// Simple Skeleton component
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded h-6 ${className}`} />
);

interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  defaultUsefulLifeYears: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  level?: number;
  children?: Category[];
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Convert flat categories to hierarchical structure
  const buildHierarchy = (items: Category[], parentId: number | null = null, level: number = 0): Category[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        level,
        children: buildHierarchy(items, item.id, level + 1)
      }));
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch categories using server action
      const fetchedCategories = await getCategories();
      
      // Build hierarchy
      const hierarchicalCategories = buildHierarchy(fetchedCategories);
      setCategories(hierarchicalCategories);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="ml-4">
        <div 
          className="flex items-center py-2 hover:bg-gray-50 cursor-pointer"
          onClick={() => toggleCategory(category.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )
          ) : (
            <div className="w-4 mr-2"></div>
          )}
          <span className="font-medium">{category.name}</span>
          {category.description && (
            <span className="text-sm text-gray-500 ml-2">
              • {category.description}
            </span>
          )}
          <span className="text-sm text-gray-500 ml-2">
            ({category.defaultUsefulLifeYears} years)
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {category.children?.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="w-full" />
        <Skeleton className="w-5/6" />
        <Skeleton className="w-4/6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        <p>Error loading categories: {error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={fetchCategories}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchCategories}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No categories found.
          </div>
        ) : (
          categories.map(category => renderCategory(category))
        )}
      </div>
    </div>
  );
}
