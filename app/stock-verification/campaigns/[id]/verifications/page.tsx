'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';

interface AssetVerification {
  id: number;
  campaignId: number;
  assetId: number;
  verificationDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'DISCREPANCY_FOUND' | 'MISSING' | 'DAMAGED' | 'REQUIRES_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  physicalCondition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED' | 'MISSING' | 'UNKNOWN';
  locationAccurate: boolean;
  notes?: string;
  photoUrls: string[];
  verificationDuration?: number;
  priority?: number;
  asset: {
    id: number;
    name: string;
    serialNumber?: string;
    currentValue?: number;
    category: {
      name: string;
    };
    state: {
      name: string;
    };
    lGA: {
      name: string;
    };
  };
  verifier?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  discrepancies: {
    id: number;
    type: string;
    severity: string;
  }[];
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface VerificationStats {
  total: number;
  pending: number;
  inProgress: number;
  verified: number;
  discrepancies: number;
  missing: number;
  damaged: number;
  requiresReview: number;
}

const statusColors = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  VERIFIED: 'bg-green-100 text-green-800',
  DISCREPANCY_FOUND: 'bg-yellow-100 text-yellow-800',
  MISSING: 'bg-red-100 text-red-800',
  DAMAGED: 'bg-orange-100 text-orange-800',
  REQUIRES_REVIEW: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  PENDING: '⏳',
  IN_PROGRESS: '🔄',
  VERIFIED: '✅',
  DISCREPANCY_FOUND: '⚠️',
  MISSING: '❌',
  DAMAGED: '🔧',
  REQUIRES_REVIEW: '👁️',
  APPROVED: '✅',
  REJECTED: '❌',
  CANCELLED: '🚫',
};

const conditionColors = {
  EXCELLENT: 'text-green-600',
  GOOD: 'text-blue-600',
  FAIR: 'text-yellow-600',
  POOR: 'text-orange-600',
  DAMAGED: 'text-red-600',
  MISSING: 'text-red-800',
  UNKNOWN: 'text-gray-600',
};

const priorityColors: Record<number, string> = {
  1: 'text-red-600',
  2: 'text-orange-600',
  3: 'text-blue-600',
  4: 'text-gray-600',
  5: 'text-gray-500',
};

export default function CampaignVerificationsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = parseInt(params.id as string);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [verifications, setVerifications] = useState<AssetVerification[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [verifierFilter, setVerifierFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('');
  const [selectedVerifications, setSelectedVerifications] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setCampaign(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch campaign');
      }
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    }
  };

  const fetchVerifications = async (page: number = 1) => {
    try {
      setLoading(page === 1);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(verifierFilter && { verifierId: verifierFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(conditionFilter && { condition: conditionFilter }),
      });

      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/verifications?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setVerifications(data.data);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch verifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verifications');
      console.error('Error fetching verifications:', err);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVerifications(1);
  };

  const handleBulkAction = async (action: 'assign' | 'unassign' | 'approve' | 'reject') => {
    if (selectedVerifications.length === 0) {
      toast.error('Please select verifications to perform bulk action');
      return;
    }

    try {
      setBulkActionLoading(true);
      
      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/verifications/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          verificationIds: selectedVerifications,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Bulk ${action} completed successfully`);
        setSelectedVerifications([]);
        fetchVerifications(currentPage);
      } else {
        throw new Error(data.error || `Failed to ${action} verifications`);
      }
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
      toast.error(err instanceof Error ? err.message : `Failed to ${action} verifications`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedVerifications.length === verifications.length) {
      setSelectedVerifications([]);
    } else {
      setSelectedVerifications(verifications.map(v => v.id));
    }
  };

  const handleSelectVerification = (verificationId: number) => {
    setSelectedVerifications(prev => 
      prev.includes(verificationId)
        ? prev.filter(id => id !== verificationId)
        : [...prev, verificationId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(value);
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      fetchVerifications();
    }
  }, [campaignId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1);
        fetchVerifications(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, verifierFilter, priorityFilter, conditionFilter]);

  if (loading && !verifications.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                <button
                  onClick={() => router.push('/stock-verification/campaigns')}
                  className="hover:text-green-600"
                >
                  Campaigns
                </button>
                <span className="mx-2">›</span>
                <button
                  onClick={() => router.push(`/stock-verification/campaigns/${campaignId}`)}
                  className="hover:text-green-600"
                >
                  {campaign?.name}
                </button>
                <span className="mx-2">›</span>
                <span>Verifications</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔍 Campaign Verifications
              </h1>
              <p className="text-gray-600">
                Manage asset verifications for {campaign?.name}
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => router.push(`/stock-verification/campaigns/${campaignId}/assignments`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                👥 Assignments
              </button>
              <button
                onClick={() => router.push(`/stock-verification/campaigns/${campaignId}`)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.discrepancies}</div>
              <div className="text-sm text-gray-600">Discrepancies</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
              <div className="text-sm text-gray-600">Missing</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.damaged}</div>
              <div className="text-sm text-gray-600">Damaged</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.requiresReview}</div>
              <div className="text-sm text-gray-600">Review</div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by asset name, serial number, verifier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="VERIFIED">Verified</option>
                <option value="DISCREPANCY_FOUND">Discrepancy Found</option>
                <option value="MISSING">Missing</option>
                <option value="DAMAGED">Damaged</option>
                <option value="REQUIRES_REVIEW">Requires Review</option>
              </select>

              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Conditions</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="DAMAGED">Damaged</option>
                <option value="MISSING">Missing</option>
                <option value="UNKNOWN">Unknown</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Priorities</option>
                <option value="1">High (1)</option>
                <option value="2">Medium-High (2)</option>
                <option value="3">Medium (3)</option>
                <option value="4">Low-Medium (4)</option>
                <option value="5">Low (5)</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedVerifications.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-blue-800 font-medium">
                  {selectedVerifications.length} verification{selectedVerifications.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={bulkActionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkActionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => setSelectedVerifications([])}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-3">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Verifications</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => fetchVerifications(currentPage)}
                className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Verifications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {verifications.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No verifications found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter || conditionFilter
                  ? 'Try adjusting your search or filters'
                  : 'Verifications will appear here when assets are assigned to this campaign'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedVerifications.length === verifications.length && verifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </div>
                  <div className="col-span-3">Asset</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-2">Condition</div>
                  <div className="col-span-2">Verifier</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Verifications */}
              <div className="divide-y divide-gray-200">
                {verifications.map((verification) => (
                  <div
                    key={verification.id}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      selectedVerifications.includes(verification.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Checkbox */}
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={selectedVerifications.includes(verification.id)}
                          onChange={() => handleSelectVerification(verification.id)}
                          className="rounded border-gray-300"
                        />
                      </div>

                      {/* Asset Info */}
                      <div className="col-span-3">
                        <div className="font-medium text-gray-900">{verification.asset.name}</div>
                        <div className="text-sm text-gray-600">
                          {verification.asset.serialNumber && `SN: ${verification.asset.serialNumber}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {verification.asset.category.name} • {verification.asset.state.name}, {verification.asset.lGA.name}
                        </div>
                        {verification.asset.currentValue && (
                          <div className="text-xs text-green-600 font-medium">
                            {formatCurrency(verification.asset.currentValue)}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[verification.status]}`}>
                          <span className="mr-1">{statusIcons[verification.status]}</span>
                          {verification.status.replace(/_/g, ' ')}
                        </span>
                        {!verification.locationAccurate && (
                          <div className="text-xs text-orange-600 mt-1">📍 Location Issue</div>
                        )}
                        {verification.discrepancies.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ {verification.discrepancies.length} discrepanc{verification.discrepancies.length > 1 ? 'ies' : 'y'}
                          </div>
                        )}
                      </div>

                      {/* Priority */}
                      <div className="col-span-1">
                        {verification.priority ? (
                          <span className={`text-sm font-medium ${priorityColors[verification.priority]}`}>
                            {verification.priority}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>

                      {/* Condition */}
                      <div className="col-span-2">
                        {verification.physicalCondition ? (
                          <span className={`text-sm font-medium ${conditionColors[verification.physicalCondition]}`}>
                            {verification.physicalCondition}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not assessed</span>
                        )}
                        {verification.photoUrls.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            📸 {verification.photoUrls.length} photo{verification.photoUrls.length > 1 ? 's' : ''}
                          </div>
                        )}
                        {verification.verificationDuration && (
                          <div className="text-xs text-gray-500 mt-1">
                            ⏱️ {formatDuration(verification.verificationDuration)}
                          </div>
                        )}
                      </div>

                      {/* Verifier */}
                      <div className="col-span-2 text-sm">
                        {verification.verifier ? (
                          <>
                            <div className="text-gray-900">
                              {verification.verifier.firstName} {verification.verifier.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {verification.verifier.email}
                            </div>
                          </>
                        ) : (
                          <span className="text-orange-600 font-medium">Unassigned</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/stock-verification/verifications/${verification.id}`)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                            title="View Details"
                          >
                            👁️
                          </button>
                          {verification.status === 'PENDING' && (
                            <button
                              onClick={() => router.push(`/stock-verification/verifications/${verification.id}/edit`)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
                              title="Edit"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes Preview */}
                    {verification.notes && (
                      <div className="mt-2 pl-12">
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Notes:</span> {verification.notes.substring(0, 100)}
                          {verification.notes.length > 100 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}