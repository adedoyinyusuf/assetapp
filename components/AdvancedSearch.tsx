'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Save,
  History,
  TrendingUp,
  Package,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { ClientSearchService as AdvancedSearchService, SearchResult, SearchSuggestion } from '@/lib/client-search';
import { SearchPermissionGate } from './PermissionGate';
import { Task } from '@/lib/auth/roles';

interface SearchFilters {
  category: string;
  state: string;
  minValue: string;
  maxValue: string;
  purchaseDateFrom: string;
  purchaseDateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    state: '',
    minValue: '',
    maxValue: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<{ name: string; query: string; filters: SearchFilters }[]>([]);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load trending searches and recent searches
    loadTrendingSearches();
    loadRecentSearches();
    loadSavedSearches();
  }, []);

  useEffect(() => {
    // Debounced search for suggestions
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions();
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const loadTrendingSearches = async () => {
    try {
      const trending = await AdvancedSearchService.getTrendingSearches();
      setTrendingSearches(trending);
    } catch (error) {
      console.error('Error loading trending searches:', error);
    }
  };

  const loadRecentSearches = () => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  };

  const loadSavedSearches = () => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  };

  const saveSearch = () => {
    const searchName = prompt('Enter a name for this search:');
    if (searchName && (query || Object.values(filters).some(v => v))) {
      const newSavedSearch = {
        name: searchName,
        query,
        filters: { ...filters }
      };

      const updated = [...savedSearches, newSavedSearch];
      setSavedSearches(updated);
      localStorage.setItem('savedSearches', JSON.stringify(updated));
    }
  };

  const loadSavedSearch = (savedSearch: { name: string; query: string; filters: SearchFilters }) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    performSearch(savedSearch.query, savedSearch.filters);
  };

  const deleteSavedSearch = (index: number) => {
    const updated = savedSearches.filter((_, i) => i !== index);
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const fetchSuggestions = async () => {
    try {
      const suggestions = await AdvancedSearchService.getSuggestions(query);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const performSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    try {
      setSearching(true);
      setLoading(true);

      const searchOptions = {
        query: searchQuery,
        filters: {
          category: searchFilters.category ? parseInt(searchFilters.category) : undefined,
          state: searchFilters.state ? parseInt(searchFilters.state) : undefined,
          minValue: searchFilters.minValue ? parseFloat(searchFilters.minValue) : undefined,
          maxValue: searchFilters.maxValue ? parseFloat(searchFilters.maxValue) : undefined,
          ...(searchFilters.purchaseDateFrom && searchFilters.purchaseDateTo && {
            dateRange: {
              start: new Date(searchFilters.purchaseDateFrom),
              end: new Date(searchFilters.purchaseDateTo)
            }
          })
        },
        sortBy: searchFilters.sortBy as any,
        sortOrder: searchFilters.sortOrder,
        limit: 50
      };

      const searchResults = await AdvancedSearchService.search(searchOptions);
      setResults(searchResults);

      // Save to recent searches
      if (searchQuery.trim()) {
        const recent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
        setRecentSearches(recent);
        localStorage.setItem('recentSearches', JSON.stringify(recent));
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, filters);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion, filters);
    setSuggestions([]);
  };

  const handleTrendingClick = (trend: string) => {
    setQuery(trend);
    performSearch(trend, filters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      state: '',
      minValue: '',
      maxValue: '',
      purchaseDateFrom: '',
      purchaseDateTo: '',
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const exportResults = async (format: 'csv' | 'json') => {
    if (results.length === 0) return;

    try {
      const exportData = await AdvancedSearchService.exportSearchResults(results, format);

      const blob = new Blob([exportData], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `search-results-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export results');
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Search</h2>
          <p className="text-gray-600">Find assets with intelligent search and filtering</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchPermissionGate task={Task.SAVE_SEARCHES}>
            <Button
              variant="outline"
              onClick={saveSearch}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Search
            </Button>
          </SearchPermissionGate>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search for assets by name, description, category, or location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                disabled={searching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span>{suggestion.text}</span>
                      {suggestion.type && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.type}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any category</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="buildings">Buildings</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any state</SelectItem>
                      <SelectItem value="lagos">Lagos</SelectItem>
                      <SelectItem value="abuja">Abuja</SelectItem>
                      <SelectItem value="kano">Kano</SelectItem>
                      <SelectItem value="rivers">Rivers</SelectItem>
                      <SelectItem value="kaduna">Kaduna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="minValue">Min Value (₦)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minValue}
                    onChange={(e) => handleFilterChange('minValue', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="maxValue">Max Value (₦)</Label>
                  <Input
                    type="number"
                    placeholder="1000000"
                    value={filters.maxValue}
                    onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseDateFrom">Purchase Date From</Label>
                  <Input
                    type="date"
                    value={filters.purchaseDateFrom}
                    onChange={(e) => handleFilterChange('purchaseDateFrom', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseDateTo">Purchase Date To</Label>
                  <Input
                    type="date"
                    value={filters.purchaseDateTo}
                    onChange={(e) => handleFilterChange('purchaseDateTo', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="value">Value</SelectItem>
                      <SelectItem value="purchaseDate">Purchase Date</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <Button type="submit" disabled={searching} className="flex-1">
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Search Results and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">
                Search Results {results.length > 0 && `(${results.length})`}
              </h3>
              {query && (
                <p className="text-sm text-gray-600">
                  Results for &quot;{query}&quot;
                </p>
              )}
            </div>

            {results.length > 0 && (
              <div className="flex gap-2">
                <SearchPermissionGate task={Task.EXPORT_REPORTS}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportResults('csv')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </SearchPermissionGate>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Searching assets...</p>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">
                            <span dangerouslySetInnerHTML={{
                              __html: highlightText(result.title, query)
                            }} />
                          </h4>
                          <Badge variant="outline">{result.metadata.category}</Badge>
                          <Badge variant="secondary">{result.metadata.state}</Badge>
                        </div>

                        <p className="text-gray-600 mb-2">
                          <span dangerouslySetInnerHTML={{
                            __html: highlightText(result.description || '', query)
                          }} />
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {result.metadata.category}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {result.metadata.state}, {result.metadata.lga}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {result.metadata.purchaseDate ? new Date(result.metadata.purchaseDate).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ₦{result.metadata.purchaseValue ? result.metadata.purchaseValue.toLocaleString() : '0'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          ₦{result.metadata.purchaseValue ? result.metadata.purchaseValue.toLocaleString() : '0'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Relevance: {(result.relevance * 10).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && query && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  No assets match your search criteria. Try adjusting your search terms or filters.
                </p>
                <Button variant="outline" onClick={() => setQuery('')}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Trending Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trendingSearches.map((trend, index) => (
                  <button
                    key={index}
                    onClick={() => handleTrendingClick(trend)}
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {trend}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleTrendingClick(search)}
                    className="w-full text-left text-sm text-gray-600 hover:text-gray-800 hover:underline"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Saved Searches */}
          <SearchPermissionGate task={Task.SAVE_SEARCHES}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Save className="h-4 w-4" />
                  Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedSearches.map((savedSearch, index) => (
                    <div key={index} className="flex items-center justify-between group">
                      <button
                        onClick={() => loadSavedSearch(savedSearch)}
                        className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex-1 text-left"
                      >
                        {savedSearch.name}
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(index)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {savedSearches.length === 0 && (
                    <p className="text-xs text-gray-500">No saved searches</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </SearchPermissionGate>
        </div>
      </div>
    </div>
  );
}
