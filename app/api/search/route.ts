import { NextResponse } from 'next/server';
import { AdvancedSearchService } from '@/lib/search';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const lga = searchParams.get('lga');
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const searchOptions = {
      query,
      filters: {
        ...(category && { category: parseInt(category) }),
        ...(state && { state: parseInt(state) }),
        ...(lga && { lga: parseInt(lga) }),
        ...(minValue && { minValue: parseFloat(minValue) }),
        ...(maxValue && { maxValue: parseFloat(maxValue) }),
        ...(startDate && endDate && {
          dateRange: {
            start: new Date(startDate),
            end: new Date(endDate)
          }
        })
      },
      limit,
      offset,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    };

    const results = await AdvancedSearchService.search(searchOptions);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
