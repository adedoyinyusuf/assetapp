import { format, parseISO, isValid, differenceInDays, addDays } from 'date-fns';
import { 
  AssetVerificationStatus,
  VerificationCampaignStatus,
  DiscrepancySeverity,
  PhysicalCondition 
} from '@prisma/client';

// =============================================================================
// DATE AND TIME UTILITIES
// =============================================================================

export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatStr) : '';
  } catch {
    return '';
  }
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

export function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const now = new Date();
    const diffDays = differenceInDays(now, dateObj);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return '';
  }
}

export function calculateDaysBetween(startDate: Date | string, endDate: Date | string): number {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) return 0;
    
    return differenceInDays(end, start);
  } catch {
    return 0;
  }
}

export function addBusinessDays(date: Date | string, days: number): Date {
  const startDate = typeof date === 'string' ? parseISO(date) : date;
  return addDays(startDate, days);
}

// =============================================================================
// PROGRESS CALCULATION UTILITIES
// =============================================================================

export function calculateVerificationProgress(
  totalAssets: number,
  verifiedAssets: number
): number {
  if (totalAssets === 0) return 0;
  return Math.round((verifiedAssets / totalAssets) * 100);
}

export function calculateCompletionRate(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function calculateEfficiency(
  completedCount: number,
  targetCount: number,
  daysElapsed: number
): number {
  if (targetCount === 0 || daysElapsed === 0) return 0;
  const dailyTarget = targetCount / daysElapsed;
  const actualDaily = completedCount / daysElapsed;
  return Math.round((actualDaily / dailyTarget) * 100);
}

// =============================================================================
// STATUS AND CONDITION UTILITIES
// =============================================================================

export function getStatusColor(status: AssetVerificationStatus | VerificationCampaignStatus): string {
  const statusColors: Record<string, string> = {
    // Campaign statuses
    PLANNED: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-gray-50 text-gray-600',
    
    // Verification statuses
    PENDING: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    VERIFIED: 'bg-green-100 text-green-800',
    DISCREPANCY_FOUND: 'bg-orange-100 text-orange-800',
    MISSING: 'bg-red-100 text-red-800',
    DAMAGED: 'bg-red-100 text-red-800',
    REQUIRES_REVIEW: 'bg-purple-100 text-purple-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export function getSeverityColor(severity: DiscrepancySeverity): string {
  const severityColors: Record<DiscrepancySeverity, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  
  return severityColors[severity];
}

export function getConditionColor(condition: PhysicalCondition): string {
  const conditionColors: Record<PhysicalCondition, string> = {
    EXCELLENT: 'bg-green-100 text-green-800',
    GOOD: 'bg-blue-100 text-blue-800',
    FAIR: 'bg-yellow-100 text-yellow-800',
    POOR: 'bg-orange-100 text-orange-800',
    DAMAGED: 'bg-red-100 text-red-800',
    MISSING: 'bg-red-100 text-red-800',
    UNKNOWN: 'bg-gray-100 text-gray-800',
  };
  
  return conditionColors[condition];
}

export function getStatusPriority(status: AssetVerificationStatus): number {
  const statusPriority: Record<AssetVerificationStatus, number> = {
    MISSING: 1,
    DAMAGED: 2,
    DISCREPANCY_FOUND: 3,
    REQUIRES_REVIEW: 4,
    REJECTED: 5,
    IN_PROGRESS: 6,
    PENDING: 7,
    VERIFIED: 8,
    APPROVED: 9,
  };
  
  return statusPriority[status] || 10;
}

// =============================================================================
// FILE AND MEDIA UTILITIES
// =============================================================================

export function generateUniqueFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  const prefixStr = prefix ? `${prefix}_` : '';
  
  return `${prefixStr}${cleanName}_${timestamp}_${randomStr}.${extension}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateImageDimensions(
  width: number,
  height: number,
  minWidth: number = 100,
  minHeight: number = 100,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): boolean {
  return width >= minWidth && 
         height >= minHeight && 
         width <= maxWidth && 
         height <= maxHeight;
}

// =============================================================================
// SEARCH AND FILTERING UTILITIES
// =============================================================================

export function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function createSearchTerms(query: string): string[] {
  return normalizeSearchTerm(query)
    .split(' ')
    .filter(term => term.length > 0);
}

export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// =============================================================================
// LOCATION AND COORDINATE UTILITIES
// =============================================================================

export function formatCoordinates(coordinates: string): { lat: number; lng: number } | null {
  try {
    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    
    return { lat, lng };
  } catch {
    return null;
  }
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  
  return Math.round(d * 1000) / 1000; // Round to 3 decimal places
}

// =============================================================================
// QR CODE AND BARCODE UTILITIES
// =============================================================================

export function extractAssetIdFromQR(qrData: string): number | null {
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(qrData);
    if (parsed.assetId && typeof parsed.assetId === 'number') {
      return parsed.assetId;
    }
    
    // Try extracting from URL pattern
    const urlMatch = qrData.match(/\/assets\/(\d+)/);
    if (urlMatch) {
      return parseInt(urlMatch[1], 10);
    }
    
    // Try direct number parsing
    const numMatch = qrData.match(/^\d+$/);
    if (numMatch) {
      return parseInt(qrData, 10);
    }
    
    return null;
  } catch {
    return null;
  }
}

export function generateAssetQRData(assetId: number, baseUrl: string = ''): string {
  return JSON.stringify({
    assetId,
    url: `${baseUrl}/assets/${assetId}`,
    timestamp: new Date().toISOString(),
  });
}

// =============================================================================
// ANALYTICS AND REPORTING UTILITIES
// =============================================================================

export function calculateTrends(
  currentData: number[],
  previousData: number[]
): Array<{ value: number; trend: 'up' | 'down' | 'stable'; percentage: number }> {
  return currentData.map((current, index) => {
    const previous = previousData[index] || 0;
    
    if (previous === 0) {
      return {
        value: current,
        trend: current > 0 ? 'up' : 'stable' as const,
        percentage: 0,
      };
    }
    
    const percentage = Math.round(((current - previous) / previous) * 100);
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return {
      value: current,
      trend,
      percentage: Math.abs(percentage),
    };
  });
}

export function generateReportSummary(data: {
  totalAssets: number;
  verifiedAssets: number;
  discrepancyCount: number;
  completionRate: number;
}) {
  const { totalAssets, verifiedAssets, discrepancyCount, completionRate } = data;
  
  return {
    overview: {
      totalAssets,
      verifiedAssets,
      pendingAssets: totalAssets - verifiedAssets,
      discrepancyCount,
      completionRate,
    },
    insights: {
      verificationEfficiency: completionRate > 90 ? 'High' : completionRate > 70 ? 'Medium' : 'Low',
      discrepancyRate: totalAssets > 0 ? Math.round((discrepancyCount / totalAssets) * 100) : 0,
      qualityScore: Math.max(0, 100 - ((discrepancyCount / Math.max(verifiedAssets, 1)) * 100)),
    },
  };
}

// =============================================================================
// PERMISSION AND ACCESS UTILITIES
// =============================================================================

export function checkCampaignAccess(
  userStateIds: number[],
  userLgaIds: number[],
  campaignStateIds: number[],
  campaignLgaIds: number[]
): boolean {
  // Check if user has access to at least one of the campaign's states
  const hasStateAccess = campaignStateIds.some(stateId => 
    userStateIds.includes(stateId)
  );
  
  // If no specific LGAs assigned to campaign, state access is sufficient
  if (campaignLgaIds.length === 0) {
    return hasStateAccess;
  }
  
  // Check LGA access if specific LGAs are assigned
  const hasLgaAccess = campaignLgaIds.some(lgaId => 
    userLgaIds.includes(lgaId)
  );
  
  return hasStateAccess && hasLgaAccess;
}

export function getUserAccessLevel(userRoleId: number): 'admin' | 'manager' | 'officer' | 'viewer' {
  // This would typically come from a role mapping
  // For now, using a simple mapping based on role ID
  const roleMapping: Record<number, 'admin' | 'manager' | 'officer' | 'viewer'> = {
    1: 'admin',
    2: 'manager',
    3: 'officer',
    4: 'viewer',
  };
  
  return roleMapping[userRoleId] || 'viewer';
}