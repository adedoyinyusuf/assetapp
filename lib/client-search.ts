// Client-safe search service - uses API calls instead of direct Prisma

export interface SearchResult {
  id: number;
  type: 'asset' | 'category' | 'location' | 'user';
  title: string;
  description: string;
  relevance: number;
  metadata: Record<string, any>;
  highlights: string[];
}

export interface SearchFilters {
  category?: number;
  state?: number;
  lga?: number;
  minValue?: number;
  maxValue?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: 'active' | 'retired' | 'maintenance';
  tags?: string[];
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'name' | 'value' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchSuggestion {
  text: string;
  type: 'asset' | 'category' | 'location';
  count: number;
  relevance: number;
}

export class ClientSearchService {
  /**
   * Perform advanced search using API calls
   */
  static async search({ 
    query = '', 
    filters, 
    limit = 10, 
    offset = 0, 
    sortBy = 'relevance', 
    sortOrder = 'desc' 
  }: SearchOptions): Promise<SearchResult[]> {
    try {
      const url = new URL('/api/search', window.location.origin);
      url.searchParams.set('q', query);
      if (filters?.category) url.searchParams.set('category', filters.category.toString());
      if (filters?.state) url.searchParams.set('state', filters.state.toString());
      if (filters?.lga) url.searchParams.set('lga', filters.lga.toString());
      if (filters?.minValue) url.searchParams.set('minValue', filters.minValue.toString());
      if (filters?.maxValue) url.searchParams.set('maxValue', filters.maxValue.toString());
      if (filters?.dateRange?.start) url.searchParams.set('startDate', filters.dateRange.start.toISOString());
      if (filters?.dateRange?.end) url.searchParams.set('endDate', filters.dateRange.end.toISOString());
      url.searchParams.set('sortBy', sortBy);
      url.searchParams.set('sortOrder', sortOrder);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', offset.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get search suggestions using API calls
   */
  static async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const url = new URL('/api/search/suggestions', window.location.origin);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Suggestions failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  /**
   * Get mock trending searches for development/fallback
   */
  static getTrendingSearches(): Promise<string[]> {
    return Promise.resolve([
      'laptop',
      'vehicle',
      'furniture',
      'computer',
      'office equipment',
      'electronics',
      'machinery',
      'tools'
    ]);
  }

  /**
   * Get related assets using fetch
   */
  static async getRelatedAssets(assetId: number, limit: number = 5): Promise<any[]> {
    try {
      const url = new URL(`/api/assets/${assetId}/related`, window.location.origin);
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting related assets:', error);
      return [];
    }
  }

  /**
   * Get search analytics (mock data for now)
   */
  static async getSearchAnalytics() {
    // Return mock data - in a real app this would come from an API
    return {
      totalSearches: 1250,
      popularQueries: [
        { query: 'laptop', count: 45 },
        { query: 'vehicle', count: 32 },
        { query: 'furniture', count: 28 },
        { query: 'computer', count: 25 },
        { query: 'office', count: 22 },
      ],
      searchTrends: [
        { date: '2024-01-01', count: 15 },
        { date: '2024-01-02', count: 18 },
        { date: '2024-01-03', count: 22 },
        { date: '2024-01-04', count: 19 },
        { date: '2024-01-05', count: 25 },
      ],
      noResultsQueries: [
        { query: 'nonexistent', count: 5 },
        { query: 'invalid', count: 3 },
        { query: 'test', count: 2 },
      ],
    };
  }

  /**
   * Export search results
   */
  static async exportSearchResults(results: SearchResult[], format: 'csv' | 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    } else {
      // Convert to CSV
      const csvHeader = 'ID,Type,Title,Description,Relevance,Category,State,Value\n';
      const csvRows = results.map(result => {
        const metadata = result.metadata || {};
        return [
          result.id,
          result.type,
          `"${result.title}"`,
          `"${result.description}"`,
          result.relevance,
          metadata.category || '',
          metadata.state || '',
          metadata.purchaseValue || ''
        ].join(',');
      }).join('\n');
      
      return csvHeader + csvRows;
    }
  }

  /**
   * Get mock search results for development/fallback
   */
  static getMockSearchResults(query: string): SearchResult[] {
    return [
      {
        id: 1,
        type: 'asset',
        title: `Sample Laptop (${query})`,
        description: 'Dell XPS 13 laptop with 16GB RAM and 512GB SSD',
        relevance: 95,
        metadata: {
          purchaseDate: '2023-06-15',
          purchaseValue: 1500,
          category: 'Electronics',
          state: 'Lagos',
          lga: 'Ikeja'
        },
        highlights: [`Asset: Sample Laptop (${query})`]
      },
      {
        id: 2,
        type: 'asset',
        title: `Office Chair (${query})`,
        description: 'Ergonomic office chair with adjustable height',
        relevance: 75,
        metadata: {
          purchaseDate: '2023-08-20',
          purchaseValue: 350,
          category: 'Furniture',
          state: 'Abuja',
          lga: 'Wuse'
        },
        highlights: [`Asset: Office Chair (${query})`]
      },
      {
        id: 3,
        type: 'asset',
        title: `Projector (${query})`,
        description: 'Epson projector for conference room presentations',
        relevance: 60,
        metadata: {
          purchaseDate: '2023-04-10',
          purchaseValue: 1200,
          category: 'Electronics',
          state: 'Lagos',
          lga: 'Victoria Island'
        },
        highlights: [`Asset: Projector (${query})`]
      }
    ];
  }
}
