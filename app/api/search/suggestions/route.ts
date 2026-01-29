import { NextResponse } from 'next/server';
import { AdvancedSearchService } from '@/lib/search';

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim() || query.length < 2) {
      return NextResponse.json([]);
    }

    const suggestions = await AdvancedSearchService.getSuggestions(query, limit);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
