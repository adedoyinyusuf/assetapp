import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { DiscrepancyService } from '@/lib/stock-verification/discrepancy-service';
import { z } from 'zod';
import { DiscrepancySeverity, DiscrepancyStatus, DiscrepancyType } from '@prisma/client';

// =============================================================================
// REPORT GENERATION SCHEMA
// =============================================================================

const reportQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  severity: z.string().optional().transform((val) => 
    val ? val.split(',').filter(Boolean) : undefined
  ),
  status: z.string().optional().transform((val) => 
    val ? val.split(',').filter(Boolean) : undefined
  ),
  type: z.string().optional().transform((val) => 
    val ? val.split(',').filter(Boolean) : undefined
  ),
  assigneeId: z.string().optional().transform((val) => 
    val ? parseInt(val) : undefined
  ),
  format: z.enum(['json', 'csv', 'excel']).default('json'),
});

// =============================================================================
// GET /api/stock-verification/campaigns/[id]/discrepancy-report
// Generate discrepancy report for a campaign
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return Response.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validationResult = reportQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { format, ...rawFilters } = validationResult.data;

    // Map string arrays to typed enum arrays, filtering out invalid values
    const filters = {
      dateFrom: rawFilters.dateFrom,
      dateTo: rawFilters.dateTo,
      severity: rawFilters.severity?.filter((s) => ['CRITICAL','HIGH','MEDIUM','LOW'].includes(s)) as DiscrepancySeverity[] | undefined,
      status: rawFilters.status?.filter((s) => ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'].includes(s)) as DiscrepancyStatus[] | undefined,
      type: rawFilters.type?.filter((t) => ['MISSING_ASSET','PHYSICAL_DAMAGE','LOCATION_MISMATCH','DATA_INCONSISTENCY','CONDITION_MISMATCH'].includes(t)) as DiscrepancyType[] | undefined,
      assigneeId: rawFilters.assigneeId,
    };

    // Initialize service
    const discrepancyService = new DiscrepancyService();

    // Generate discrepancy report
    const report = await discrepancyService.generateDiscrepancyReport(
      campaignId,
      filters,
      parseInt(session.user.id)
    );

    // Handle different output formats
    if (format === 'csv') {
      return handleCSVExport(report);
    } else if (format === 'excel') {
      return handleExcelExport(report);
    } else {
      // Default JSON response
      return Response.json({
        success: true,
        data: report,
      });
    }

  } catch (error: any) {
    console.error('Error generating discrepancy report:', error);

    if (error.message?.includes('Insufficient permissions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.message?.includes('not found')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to generate discrepancy report' },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR EXPORT FORMATS
// =============================================================================

function handleCSVExport(report: any): Response {
  // Generate CSV headers
  const headers = [
    'Reference',
    'Asset Tag',
    'Asset Name',
    'Category',
    'State',
    'LGA',
    'Type',
    'Severity',
    'Status',
    'Title',
    'Description',
    'Reported At',
    'Reported By',
    'Assigned To',
    'Resolved By',
    'Resolved At',
    'Resolution Notes'
  ];

  // Generate CSV rows
  const rows: (string | number | null)[][] = report.discrepancies.map((d: any) => [
    d.reference,
    d.assetTag,
    d.assetName || '',
    d.category,
    d.state,
    d.lga,
    d.type,
    d.severity,
    d.status,
    `"${d.title}"`,
    `"${d.description}"`,
    new Date(d.reportedAt).toISOString(),
    d.reportedBy,
    d.assignedTo || '',
    d.resolvedBy || '',
    d.resolvedAt ? new Date(d.resolvedAt).toISOString() : '',
    `"${d.resolutionNotes || ''}"`,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row: (string | number | null)[]) => row.join(','))
  ].join('\n');

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="discrepancy-report-${report.campaignId}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function handleExcelExport(report: any): Response {
  // For Excel export, we'll return a structured format that can be processed client-side
  // In a real implementation, you might use a library like 'xlsx' to generate actual Excel files
  const excelData = {
    filename: `discrepancy-report-${report.campaignId}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheets: [
      {
        name: 'Summary',
        data: [
          ['Total Discrepancies', report.summary.totalDiscrepancies],
          ['By Status', ''],
          ...Object.entries(report.summary.byStatus).map(([key, value]) => [key, value]),
          ['', ''],
          ['By Severity', ''],
          ...Object.entries(report.summary.bySeverity).map(([key, value]) => [key, value]),
          ['', ''],
          ['By Type', ''],
          ...Object.entries(report.summary.byType).map(([key, value]) => [key, value]),
        ]
      },
      {
        name: 'Discrepancies',
        data: [
          [
            'Reference', 'Asset Tag', 'Asset Name', 'Category', 'State', 'LGA',
            'Type', 'Severity', 'Status', 'Title', 'Description',
            'Reported At', 'Reported By', 'Assigned To', 'Resolved By', 'Resolved At', 'Resolution Notes'
          ],
          ...report.discrepancies.map((d: any) => [
            d.reference,
            d.assetTag,
            d.assetName || '',
            d.category,
            d.state,
            d.lga,
            d.type,
            d.severity,
            d.status,
            d.title,
            d.description,
            new Date(d.reportedAt).toISOString(),
            d.reportedBy,
            d.assignedTo || '',
            d.resolvedBy || '',
            d.resolvedAt ? new Date(d.resolvedAt).toISOString() : '',
            d.resolutionNotes || '',
          ])
        ]
      }
    ]
  };

  return Response.json({
    success: true,
    data: excelData,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}