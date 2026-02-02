'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Plus, Calendar, Users, CheckCircle2, Clock, TrendingUp, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportDialog } from "@/components/export/ExportDialog";
import { redirect } from "next/navigation";

interface AssetVerification {
  id: number;
  campaignId: number;
  assetId: number;
  verificationDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'DISCREPANCY_FOUND' | 'MISSING' | 'DAMAGED' | 'REQUIRES_REVIEW' | 'APPROVED' | 'REJECTED';
  physicalCondition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED' | 'MISSING' | 'UNKNOWN';
  locationAccurate: boolean;
  notes?: string;
  photoUrls: string[];
  campaign: {
    id: number;
    name: string;
  };
  asset: {
    id: number;
    name: string;
    serialNumber?: string;
    category: {
      name: string;
    };
    state: {
      name: string;
    };
    lga: {
      name: string;
    };
  };
  verifier: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
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

export default function VerificationsPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<AssetVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const fetchVerifications = async (page: number = 1, search?: string, status?: string, campaign?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && search.trim() && { search: search.trim() }),
        ...(status && status.trim() && { status: status.trim() }),
        ...(campaign && campaign.trim() && { campaignId: campaign.trim() }),
      });

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('Fetch timeout after 25 seconds');
      }, 25000); // 25 second timeout

      try {
        console.log('Fetching verifications from:', `/api/stock-verification/verifications?${params}`);

        const response = await fetch(`/api/stock-verification/verifications?${params}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch (e) {
            // If response is not JSON, try to get text
            const text = await response.text().catch(() => '');
            errorData = { error: text || `HTTP error! status: ${response.status}` };
          }
          console.error('API error response:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', { success: data.success, dataLength: data.data?.length, pagination: data.pagination });

        if (data.success) {
          setVerifications(data.data || []);
          setCurrentPage(data.pagination?.page || page);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          throw new Error(data.error || 'Failed to fetch verifications');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', fetchError);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 25 seconds. The server may be slow. Please try again.');
        }
        if (fetchError.message?.includes('Failed to fetch')) {
          throw new Error('Unable to connect to server. Please check your connection and try again.');
        }
        throw fetchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load verifications';
      setError(errorMessage);
      console.error('Error fetching verifications:', err);
      // Set empty data to show no results state
      setVerifications([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const [campaigns, setCampaigns] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    // Fetch campaigns for the filter
    const loadCampaigns = async () => {
      try {
        const res = await fetch('/api/stock-verification/campaigns?status=ACTIVE&limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCampaigns(data.data);
        }
      } catch (err) {
        console.error('Failed to load campaigns for filter', err);
      }
    };
    loadCampaigns();
  }, []);

  // ... (keep existing useEffect for verifications)

  // Update existing useEffect (lines 168-208 in original) 
  useEffect(() => {
    // Use a ref to prevent duplicate calls
    let isMounted = true;
    let safetyTimeoutId: NodeJS.Timeout;

    const loadData = async () => {
      if (!isMounted) return;

      // Safety timeout - force stop loading after 40 seconds
      safetyTimeoutId = setTimeout(() => {
        if (isMounted) {
          console.error('Verifications page: Safety timeout - forcing stop');
          setError('Request is taking too long. Please check your connection or try refreshing the page.');
          setLoading(false);
          setVerifications([]);
        }
      }, 40000);

      try {
        setLoadAttempts(prev => prev + 1);
        await fetchVerifications(currentPage, searchTerm, statusFilter, campaignFilter);
      } catch (err) {
        if (isMounted) {
          console.error('Error in useEffect:', err);
          // Don't set error here - fetchVerifications already handles it
        }
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimeoutId);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, statusFilter, campaignFilter]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVerifications(1, searchTerm, statusFilter, campaignFilter);
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

  if (loading && verifications.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2 font-medium">Loading asset verifications...</p>
          <p className="text-sm text-gray-500 mb-4">This may take a moment</p>
          {loadAttempts > 1 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Still loading... (Attempt {loadAttempts})
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchVerifications(currentPage, searchTerm, statusFilter, campaignFilter);
                }}
                className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                Retry Now
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Verifications</h1>
              <p className="text-muted-foreground">View and manage all asset verifications</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <Link href="/stock-verification/verifications/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Verification
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by asset, verifier name, or serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </form>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

            {/* Campaign Filter */}
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>
          </div>
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
                onClick={() => fetchVerifications(currentPage, searchTerm, statusFilter, campaignFilter)}
                className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Verifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {verifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No verifications found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter || campaignFilter
                  ? 'Try adjusting your search or filters'
                  : 'Asset verifications will appear here when campaigns are started'
                }
              </p>
              <button
                onClick={() => router.push('/stock-verification/campaigns')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                View Campaigns
              </button>
            </div>
          ) : (
            <>
              {/* Table Header - Hidden on Mobile */}
              <div className="hidden md:block bg-gray-50 px-6 py-3 border-b">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-3">Asset</div>
                  <div className="col-span-2">Campaign</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Condition</div>
                  <div className="col-span-2">Verified By</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Verifications List */}
              <div className="divide-y divide-gray-200">
                {verifications.map((verification) => (
                  <div
                    key={verification.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/stock-verification/verifications/${verification.id}`)}
                  >
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center">
                      {/* Asset Info */}
                      <div className="md:col-span-3">
                        <div className="flex justify-between items-start md:block">
                          <div>
                            <div className="font-medium text-gray-900">{verification.asset.name}</div>
                            <div className="text-sm text-gray-600">
                              {verification.asset.serialNumber && `SN: ${verification.asset.serialNumber}`}
                            </div>
                          </div>
                          {/* Mobile Status Badge (shown here on mobile, hidden on desktop via CSS if needed, or duplicate) 
                              Actually, better to keep layout consistent. Let's stack. 
                          */}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {verification.asset.category.name} • {verification.asset.state.name}, {verification.asset.lga.name}
                        </div>
                      </div>

                      {/* Campaign - Mobile Label included */}
                      <div className="md:col-span-2 flex flex-col">
                        <span className="md:hidden text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Campaign</span>
                        <div className="text-sm font-medium text-gray-900">{verification.campaign.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(verification.verificationDate)}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between md:justify-start">
                          <span className="md:hidden text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[verification.status]}`}>
                            <span className="mr-1">{statusIcons[verification.status]}</span>
                            {verification.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {!verification.locationAccurate && (
                          <div className="text-xs text-orange-600 mt-1 text-right md:text-left">📍 Location Issue</div>
                        )}
                      </div>

                      {/* Condition */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between md:justify-start">
                          <span className="md:hidden text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Condition</span>
                          {verification.physicalCondition ? (
                            <span className={`text-sm font-medium ${conditionColors[verification.physicalCondition]}`}>
                              {verification.physicalCondition}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assessed</span>
                          )}
                        </div>
                        {verification.photoUrls.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1 text-right md:text-left">
                            📸 {verification.photoUrls.length} photo{verification.photoUrls.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Verifier */}
                      <div className="md:col-span-2 text-sm">
                        <span className="md:hidden text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Verified By</span>
                        <div className="text-gray-900">
                          {verification.verifier.firstName} {verification.verifier.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {verification.verifier.email}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-1 flex justify-end md:block mt-2 md:mt-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/stock-verification/verifications/${verification.id}`);
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>

                    {/* Notes Preview */}
                    {verification.notes && (
                      <div className="mt-3 pl-0 md:pl-0">
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

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {verifications.filter(v => v.status === 'VERIFIED').length}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {verifications.filter(v => v.status === 'PENDING' || v.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {verifications.filter(v => v.status === 'DISCREPANCY_FOUND').length}
            </div>
            <div className="text-sm text-gray-600">Discrepancies</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">
              {verifications.filter(v => v.status === 'MISSING' || v.status === 'DAMAGED').length}
            </div>
            <div className="text-sm text-gray-600">Issues</div>
          </div>
        </div>
      </div>
      {/* Pagination */}
      {/* ... keeping existing pagination ... */}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        dataType="verifications"
        title="Export Verifications"
      />
    </div >
  );
}