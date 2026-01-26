export interface ComplianceIssue {
    assetId: number;
    assetName: string;
    issueType: 'VERIFICATION_OVERDUE' | 'MAINTENANCE_OVERDUE' | 'NO_CUSTODIAN' | 'MISSING_DATA';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    actionRequired: string;
}

export function checkAssetCompliance(asset: any): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const now = new Date();

    // 1. Verification Check (e.g., every 6 months)
    const VERIFICATION_THRESHOLD_MONTHS = 6;
    let lastVerified = asset.lastVerifiedAt ? new Date(asset.lastVerifiedAt) : null;

    // If never verified and older than 1 month, flag it
    const createdDate = new Date(asset.createdAt);
    const ageInMonths = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (!lastVerified && ageInMonths > 1) {
        issues.push({
            assetId: asset.id,
            assetName: asset.name,
            issueType: 'VERIFICATION_OVERDUE',
            severity: 'HIGH',
            description: 'Asset has never been verified.',
            actionRequired: 'Schedule immediate verification.'
        });
    } else if (lastVerified) {
        const monthsSinceVerification = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsSinceVerification > VERIFICATION_THRESHOLD_MONTHS) {
            issues.push({
                assetId: asset.id,
                assetName: asset.name,
                issueType: 'VERIFICATION_OVERDUE',
                severity: 'MEDIUM',
                description: `Last verified ${Math.floor(monthsSinceVerification)} months ago.`,
                actionRequired: 'Include in next stock verification.'
            });
        }
    }

    // 2. Custody Check (Active assets must have a custodian)
    if (asset.status === 'IN_USE' && !asset.assignedToUserId) {
        issues.push({
            assetId: asset.id,
            assetName: asset.name,
            issueType: 'NO_CUSTODIAN',
            severity: 'HIGH',
            description: 'Asset is marked IN_USE but has no assigned custodian.',
            actionRequired: 'Assign custody or change status to IN_STORE.'
        });
    }

    // 3. Maintenance Check (if nextMaintenanceDate is set and passed)
    if (asset.nextMaintenanceDate) {
        const maintenanceDate = new Date(asset.nextMaintenanceDate);
        if (maintenanceDate < now && asset.status !== 'UNDER_MAINTENANCE') {
            issues.push({
                assetId: asset.id,
                assetName: asset.name,
                issueType: 'MAINTENANCE_OVERDUE',
                severity: 'MEDIUM',
                description: 'Scheduled maintenance date has passed.',
                actionRequired: 'Initiate maintenance request.'
            });
        }
    }

    return issues;
}

export function getComplianceHealth(assets: any[]) {
    const totalAssets = assets.length;
    if (totalAssets === 0) return { score: 100, issues: [] };

    let compliantCount = 0;
    const allIssues: ComplianceIssue[] = [];

    assets.forEach(asset => {
        const assetIssues = checkAssetCompliance(asset);
        if (assetIssues.length === 0) {
            compliantCount++;
        } else {
            allIssues.push(...assetIssues);
        }
    });

    const score = Math.round((compliantCount / totalAssets) * 100);

    return {
        score,
        compliantCount,
        totalAssets,
        issues: allIssues.sort((a, b) => (a.severity === 'HIGH' ? -1 : 1)) // High severity first
    };
}
