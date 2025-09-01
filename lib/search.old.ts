import { prisma } from './server-prisma';
import type { Asset } from '@/app/actions';

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

export class AdvancedSearchService {
  /**
   * Perform advanced search with filters and AI-powered relevance scoring
   */
  static async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, filters, limit = 20, offset = 0, sortBy = 'relevance', sortOrder = 'desc' } = options;

    try {
      // Build search query
      const searchQuery = this.buildSearchQuery(query, filters);
      
      // Execute search
      const results = await this.executeSearch(searchQuery, limit, offset);
      
      // Apply AI-powered relevance scoring
      const scoredResults = await this.scoreResults(results, query);
      
      // Sort results
      const sortedResults = this.sortResults(scoredResults, sortBy, sortOrder);
      
      return sortedResults;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get search suggestions based on user input
   */
  static async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) return [];

    try {
      const suggestions: SearchSuggestion[] = [];

      // Asset name suggestions
      const assetSuggestions = await prisma.asset.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
        take: limit,
      });

      assetSuggestions.forEach(asset => {
        suggestions.push({
          text: asset.name,
          type: 'asset',
          count: 1,
          relevance: this.calculateRelevance(query, asset.name),
        });
      });

      // Category suggestions
      const categorySuggestions = await prisma.category.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
        take: limit,
      });

      categorySuggestions.forEach(category => {
        suggestions.push({
          text: category.name,
          type: 'category',
          count: 1,
          relevance: this.calculateRelevance(query, category.name),
        });
      });

      // Location suggestions
      const locationSuggestions = await prisma.state.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
        take: limit,
      });

      locationSuggestions.forEach(location => {
        suggestions.push({
          text: location.name,
          type: 'location',
          count: 1,
          relevance: this.calculateRelevance(query, location.name),
        });
      });

      // Sort by relevance and remove duplicates
      const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
      return uniqueSuggestions
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get trending searches and popular assets
   */
  static async getTrendingSearches(limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      // This would typically come from analytics/logging
      // For now, return popular categories and locations
      const popularCategories = await prisma.category.findMany({
        take: limit,
        orderBy: {
          assets: {
            _count: 'desc',
          },
        },
        select: {
          name: true,
          _count: {
            select: {
              assets: true,
            },
          },
        },
      });

      return popularCategories.map(category => ({
        text: category.name,
        type: 'category',
        count: category._count.assets,
        relevance: 0.8,
      }));
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  }

  /**
   * Get related assets based on current asset
   */
  static async getRelatedAssets(assetId: number, limit: number = 5): Promise<Asset[]> {
    try {
      const currentAsset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
          category: true,
          state: true,
          lga: true,
        },
      });

      if (!currentAsset) return [];

      // Find assets in the same category and location
      const relatedAssets = await prisma.asset.findMany({
        where: {
          id: { not: assetId },
          OR: [
            { categoryId: currentAsset.categoryId },
            { stateId: currentAsset.stateId },
            { lgaId: currentAsset.lgaId },
          ],
        },
        include: {
          category: true,
          state: true,
          lga: true,
        },
        take: limit,
        orderBy: {
          purchaseValue: 'desc',
        },
      });

      return relatedAssets;
    } catch (error) {
      console.error('Error getting related assets:', error);
      return [];
    }
  }

  /**
   * Build search query with filters
   */
  private static buildSearchQuery(query: string, filters?: SearchFilters) {
    const whereClause: any = {};

    // Text search
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (filters) {
      if (filters.category) {
        whereClause.categoryId = filters.category;
      }
      if (filters.state) {
        whereClause.stateId = filters.state;
      }
      if (filters.lga) {
        whereClause.lgaId = filters.lga;
      }
      if (filters.minValue !== undefined || filters.maxValue !== undefined) {
        whereClause.purchaseValue = {};
        if (filters.minValue !== undefined) {
          whereClause.purchaseValue.gte = filters.minValue;
        }
        if (filters.maxValue !== undefined) {
          whereClause.purchaseValue.lte = filters.maxValue;
        }
      }
      if (filters.dateRange) {
        whereClause.purchaseDate = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end,
        };
      }
    }

    return whereClause;
  }

  /**
   * Execute search query
   */
  private static async executeSearch(whereClause: any, limit: number, offset: number) {
    return await prisma.asset.findMany({
      where: whereClause,
      include: {
        category: true,
        state: true,
        lga: true,
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Score search results using AI-powered relevance algorithm
   */
  private static async scoreResults(assets: any[], query: string): Promise<SearchResult[]> {
    return assets.map(asset => ({
      ...asset,
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString() : '',
      createdAt: asset.createdAt ? new Date(asset.createdAt).toISOString() : '',
      updatedAt: asset.updatedAt ? new Date(asset.updatedAt).toISOString() : '',
      category: asset.category ? {
        ...asset.category,
        created_at: asset.category.created_at ? new Date(asset.category.created_at).toISOString() : null,
        updated_at: asset.category.updated_at ? new Date(asset.category.updated_at).toISOString() : null
      } : undefined,
      state: asset.state ? {
        ...asset.state,
        createdAt: asset.state.createdAt ? new Date(asset.state.createdAt).toISOString() : '',
        updatedAt: asset.state.updatedAt ? new Date(asset.state.updatedAt).toISOString() : ''
      } : undefined,
      lga: asset.lga ? {
        ...asset.lga,
        createdAt: asset.lga.createdAt ? new Date(asset.lga.createdAt).toISOString() : '',
        updatedAt: asset.lga.updatedAt ? new Date(asset.lga.updatedAt).toISOString() : ''
      } : undefined
    }));.currentValue,
        },
        highlights: this.generateHighlights(query, asset),
      };
    });
  }

  /**
   * Calculate relevance score for search results
   */
  private static calculateRelevance(query: string, text: string, asset?: any): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match gets highest score
    if (textLower === queryLower) {
      score += 100;
    }
    // Starts with query
    else if (textLower.startsWith(queryLower)) {
      score += 80;
    }
    // Contains query
    else if (textLower.includes(queryLower)) {
      score += 60;
    }
    // Partial word match
    else {
      const queryWords = queryLower.split(' ');
      const textWords = textLower.split(' ');
      
      for (const queryWord of queryWords) {
        for (const textWord of textWords) {
          if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
            score += 20;
          }
        }
      }
    }

    // Boost score based on asset properties
    if (asset) {
      // Newer assets get slight boost
      const age = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 1) score += 10;
      else if (age < 3) score += 5;

      // Higher value assets get slight boost
      if (asset.purchaseValue > 1000000) score += 5;
      else if (asset.purchaseValue > 500000) score += 3;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate search result highlights
   */
  private static generateHighlights(query: string, asset: any): string[] {
    const highlights: string[] = [];
    const queryLower = query.toLowerCase();

    // Highlight matching text in asset name
    if (asset.name.toLowerCase().includes(queryLower)) {
      highlights.push(`Asset: ${asset.name}`);
    }

    // Highlight matching category
    if (asset.category?.name.toLowerCase().includes(queryLower)) {
      highlights.push(`Category: ${asset.category.name}`);
    }

    // Highlight matching location
    if (asset.state?.name.toLowerCase().includes(queryLower)) {
      highlights.push(`State: ${asset.state.name}`);
    }
    if (asset.lga?.name.toLowerCase().includes(queryLower)) {
      highlights.push(`LGA: ${asset.lga.name}`);
    }

    return highlights;
  }

  /**
   * Sort search results
   */
  private static sortResults(results: SearchResult[], sortBy: string, sortOrder: string): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevance - b.relevance;
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'value':
          comparison = (a.metadata.value || 0) - (b.metadata.value || 0);
          break;
        case 'date':
          comparison = new Date(a.metadata.purchaseDate).getTime() - new Date(b.metadata.purchaseDate).getTime();
          break;
        default:
          comparison = a.relevance - b.relevance;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Remove duplicate suggestions
   */
  private static removeDuplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.text}-${suggestion.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get search analytics and insights
   */
  static async getSearchAnalytics(): Promise<{
    totalSearches: number;
    popularQueries: Array<{ query: string; count: number }>;
    searchTrends: Array<{ date: string; count: number }>;
    noResultsQueries: Array<{ query: string; count: number }>;
  }> {
    // This would typically come from a search analytics table
    // For now, return placeholder data
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
}

export default AdvancedSearchService;
