import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            // ... (auth check same)
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const format = searchParams.get('format'); // 'pdf' or 'excel'
        const type = searchParams.get('type') || 'campaigns'; // 'campaigns' or 'verifications'

        // Build date filter
        const dateFilter: any = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        // Fetch user context for scoping
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { role: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Build Access Filter
        const roleName = user.role.name.toUpperCase();
        let accessFilter: any = {};

        if (!['SUPER_ADMIN', 'SUPERADMIN'].includes(roleName)) {
            const userAny = user as any;
            if (userAny.lgaId) {
                accessFilter = { asset: { lgaId: userAny.lgaId } };
            } else if (userAny.stateId) {
                accessFilter = { asset: { stateId: userAny.stateId } };
            }
        }

        let reportData: any[] = [];

        if (type === 'verifications') {
            // Fetch Verifications
            const verifications = await prisma.assetVerification.findMany({
                where: objectFilter({
                    createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
                    ...accessFilter
                }),
                include: {
                    asset: { select: { name: true, serialNumber: true } },
                    campaign: { select: { name: true } },
                    verifier: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' }
            });

            reportData = verifications.map(v => ({
                id: v.id,
                assetName: v.asset.name,
                serialNumber: v.asset.serialNumber || 'N/A',
                campaignName: v.campaign.name,
                verifier: `${v.verifier.firstName} ${v.verifier.lastName}`,
                status: v.status,
                condition: v.physicalCondition || 'N/A',
                date: new Date(v.createdAt).toLocaleDateString(),
            }));
        } else {
            // Fetch Campaigns (Default)
            const campaigns = await prisma.verificationCampaign.findMany({
                where: Object.keys(dateFilter).length > 0 ? {
                    OR: [
                        { startDate: dateFilter },
                        { endDate: dateFilter },
                    ],
                } : undefined,
                orderBy: { startDate: 'desc' }
            });

            reportData = await Promise.all(
                campaigns.map(async (campaign) => {
                    const verifications = await prisma.assetVerification.findMany({
                        where: {
                            campaignId: campaign.id,
                            ...accessFilter
                        },
                        select: { status: true },
                    });

                    const verifiedCount = verifications.filter(v => ['VERIFIED', 'APPROVED'].includes(v.status)).length;
                    const pendingCount = verifications.filter(v => ['PENDING', 'IN_PROGRESS'].includes(v.status)).length;
                    const discrepancyCount = await prisma.verificationDiscrepancy.count({
                        where: {
                            verification: {
                                campaignId: campaign.id,
                                ...accessFilter
                            },
                        },
                    });

                    const targetCount = campaign.targetAssetCount || 0;
                    const completionRate = targetCount > 0 ? (verifiedCount / targetCount) * 100 : 0;

                    return {
                        name: campaign.name,
                        status: campaign.status,
                        startDate: new Date(campaign.startDate).toLocaleDateString(),
                        endDate: new Date(campaign.endDate).toLocaleDateString(),
                        target: targetCount,
                        verified: verifiedCount,
                        pending: pendingCount,
                        discrepancies: discrepancyCount,
                        completionRate: completionRate
                    };
                })
            );
        }

        if (format === 'pdf') {
            return generatePDF(reportData, startDate, endDate, type);
        } else {
            return generateExcel(reportData, startDate, endDate, type);
        }

    } catch (error: any) {
        console.error('Error exporting report:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to export report' },
            { status: 500 }
        );
    }
}

// Helper to clean undefined values from filter object
function objectFilter(obj: any) {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}

async function generateExcel(data: any[], startDate: string | null, endDate: string | null, type: string) {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type === 'verifications' ? 'Verifications' : 'Campaign Report');

    if (type === 'verifications') {
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Asset Name', key: 'assetName', width: 30 },
            { header: 'Serial #', key: 'serialNumber', width: 20 },
            { header: 'Campaign', key: 'campaignName', width: 30 },
            { header: 'Verifier', key: 'verifier', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Condition', key: 'condition', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
        ];
    } else {
        sheet.columns = [
            { header: 'Campaign Name', key: 'name', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Start Date', key: 'startDate', width: 15 },
            { header: 'End Date', key: 'endDate', width: 15 },
            { header: 'Target Assets', key: 'target', width: 15 },
            { header: 'Verified', key: 'verified', width: 15 },
            { header: 'Pending', key: 'pending', width: 15 },
            { header: 'Discrepancies', key: 'discrepancies', width: 15 },
            { header: 'Completion %', key: 'rate', width: 15 },
        ];
    }

    // Style Headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add Data
    data.forEach(row => {
        if (type === 'verifications') {
            sheet.addRow(row);
        } else {
            sheet.addRow({
                ...row,
                rate: `${row.completionRate.toFixed(1)}%`
            });
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${type}-report-${startDate || 'all'}-to-${endDate || 'now'}.xlsx"`,
        },
    });
}

async function generatePDF(data: any[], startDate: string | null, endDate: string | null, type: string) {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(type === 'verifications' ? 'Detailed Verification Report' : 'Stock Verification Report', 14, 22);

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    if (startDate && endDate) {
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 35);
    }

    let tableColumn: string[] = [];
    let tableRows: any[] = [];

    if (type === 'verifications') {
        tableColumn = ["Asset", "Serial", "Campaign", "Status", "Condition", "Date"];
        tableRows = data.map(row => [
            row.assetName,
            row.serialNumber,
            row.campaignName,
            row.status,
            row.condition,
            row.date
        ]);
    } else {
        tableColumn = ["Campaign Name", "Status", "Period", "Target", "Verified", "Pending", "Issues", "% Done"];
        tableRows = data.map(row => [
            row.name,
            row.status,
            `${row.startDate} - ${row.endDate}`,
            row.target,
            row.verified,
            row.pending,
            row.discrepancies,
            `${row.completionRate.toFixed(1)}%`
        ]);
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: type === 'verifications' ? 7 : 8 },
        headStyles: { fillColor: [22, 163, 74] }, // Emerald green
    });

    const pdfOutput = doc.output('arraybuffer');

    return new NextResponse(pdfOutput as any, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${type}-report-${startDate || 'all'}-to-${endDate || 'now'}.pdf"`,
        },
    });
}
