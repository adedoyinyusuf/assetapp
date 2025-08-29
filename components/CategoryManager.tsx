'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Search, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

// Simple Skeleton component
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded h-6 ${className}`} />
);

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  defaultUsefulLifeYears: number;
  description: string;
  level: number;
  children: Category[];
  path?: string;
}

interface CategoryResponse {
  flat: Array<Omit<Category, 'children'>>;
  hierarchical: Category[];
  timestamp: string;
  cacheHit?: boolean;
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Array<Omit<Category, 'children'>>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [minLife, setMinLife] = useState('');
  const [maxLife, setMaxLife] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (minLife) params.append('minLife', minLife);
      if (maxLife) params.append('maxLife', maxLife);
      if (parentId !== null) params.append('parentId', parentId);
      
      const response = await fetch(`/api/categories?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data: CategoryResponse = await response.json();
      setCategories(data.hierarchical || []);
      setFlatCategories(data.flat || []);
      setLastUpdated(new Date());
      setCacheHit(!!data.cacheHit);
      
      // Expand all categories by default
      const ids = new Set<number>();
      const expandCategories = (cats: Category[]) => {
        cats.forEach(cat => {
          if (cat.children && cat.children.length > 0) {
            ids.add(cat.id);
            expandCategories(cat.children);
          }
        });
      };
      expandCategories(data.hierarchical || []);
      setExpandedCategories(ids);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [parentId]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCategories();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setMinLife('');
    setMaxLife('');
    setParentId(null);
    setExpandedCategories(new Set());
  };

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="space-y-1">
        <div 
          className={`flex items-center p-2 rounded-md hover:bg-accent cursor-pointer ${depth > 0 ? 'ml-4' : ''}`}
          style={{ paddingLeft: `${depth * 1}rem` }}
          onClick={() => toggleCategory(category.id)}
        >
          {hasChildren ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6 h-6 mr-1" />
          )}
          <div className="flex-1">
            <div className="font-medium">{category.name}</div>
            <div className="text-sm text-muted-foreground">
              {category.defaultUsefulLifeYears} years • {category.description}
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {category.children.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">Category Hierarchy</h2>
            <p className="text-sm text-gray-500">
              {cacheHit && (
                <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Cached
                </span>
              )}
              {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCategories}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3 mb-4">
            <h3 className="font-medium text-sm">Filter by Useful Life (years)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="min-life" className="block text-sm font-medium text-gray-700 mb-1">
                  Min
                </label>
                <Input
                  id="min-life"
                  type="number"
                  min="0"
                  placeholder="Min years"
                  value={minLife}
                  onChange={(e) => setMinLife(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="max-life" className="block text-sm font-medium text-gray-700 mb-1">
                  Max
                </label>
                <Input
                  id="max-life"
                  type="number"
                  min="0"
                  placeholder="Max years"
                  value={maxLife}
                  onChange={(e) => setMaxLife(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-2">
              <label className="flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                  checked={parentId === 'null'}
                  onChange={(e) => setParentId(e.target.checked ? 'null' : null)}
                />
                Only show top-level categories
              </label>
            </div>
          </div>
        )}

        {/* Category tree */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No categories found. Create one to get started.
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {categories.map((category) => (
              <div key={category.id} className="space-y-1">
                <div 
                  className={`flex items-center p-3 rounded-md hover:bg-gray-50 cursor-pointer`}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.children && category.children.length > 0 ? (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.id);
                      }}
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <div className="w-8 h-6" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">
                      {category.defaultUsefulLifeYears} years • {category.description || 'No description'}
                    </div>
                  </div>
                </div>
                
                {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
                  <div className="pl-8">
                    {category.children.map(child => (
                      <div key={child.id} className="border-t p-3 hover:bg-gray-50">
                        <div className="font-medium">{child.name}</div>
                        <div className="text-sm text-gray-500">
                          {child.defaultUsefulLifeYears} years • {child.description || 'No description'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
