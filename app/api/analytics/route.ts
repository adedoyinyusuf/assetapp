import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics';

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateRange: { start: Date; end: Date } | undefined;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const analyticsData = await AnalyticsService.getAnalyticsData(dateRange);
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { format, dateRange } = await request.json();

    let parsedDateRange: { start: Date; end: Date } | undefined;
    if (dateRange?.start && dateRange?.end) {
      parsedDateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      };
    }

    const exportData = await AnalyticsService.exportAnalyticsData(format, parsedDateRange);
    
    return new NextResponse(exportData, {
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
        'Content-Disposition': `attachment; filename="analytics-${format}-${new Date().toISOString().split('T')[0]}.${format}"`
      }
    });
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}
