'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateCampaignForm from './components/CreateCampaignForm';

interface Campaign {
  id: number;
  name: string;
  description?: string;
  status: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  targetAssetCount?: number;
  actualAssetCount: number;
  verificationProgress: number;
  budget?: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  _count: {
    verifications: number;
    assignments: number;
  };
}

interface CampaignListResponse {
  success: boolean;
  data: Campaign[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const statusColors = {
  PLANNED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-purple-100 text-purple-800',
};

const statusIcons = {
  PLANNED: '📋',
  ACTIVE: '🟢',
  PAUSED: '⏸️',
  COMPLETED: '✅',
  CANCELLED: '❌',
  ARCHIVED: '📦',
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCampaigns = async (page: number = 1, search?: string, status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && { status }),
      });

      const response = await fetch(`/api/stock-verification/campaigns?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CampaignListResponse = await response.json();
      
      if (data.success) {
        setCampaigns(data.data);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error('Failed to fetch campaigns');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCampaigns(1, searchTerm, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatProgress = (progress: number) => {
    return Math.round(progress * 100) / 100;
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Verification Campaigns
              </h1>
              <p className="text-gray-600">
                Manage and monitor asset verification campaigns
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              <span className="mr-2">➕</span>
              New Campaign
            </button>
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
                  placeholder="Search campaigns..."
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
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-3">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Campaigns</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => fetchCampaigns(currentPage, searchTerm, statusFilter)}
                className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first verification campaign'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-3">Campaign</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Progress</div>
                  <div className="col-span-2">Assets</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Campaigns */}
              <div className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/stock-verification/campaigns/${campaign.id}`)}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Campaign Info */}
                      <div className="col-span-3">
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          by {campaign.creator.firstName} {campaign.creator.lastName}
                        </div>
                        {campaign.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {campaign.description}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
                          <span className="mr-1">{statusIcons[campaign.status]}</span>
                          {campaign.status}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="col-span-2 text-sm text-gray-600">
                        <div>{formatDate(campaign.startDate)}</div>
                        <div className="text-xs text-gray-500">
                          to {formatDate(campaign.endDate)}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min(campaign.verificationProgress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-medium text-gray-700">
                            {formatProgress(campaign.verificationProgress)}%
                          </div>
                        </div>
                      </div>

                      {/* Assets */}
                      <div className="col-span-2 text-sm">
                        <div className="text-gray-900 font-medium">
                          {campaign.actualAssetCount} / {campaign.targetAssetCount || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {campaign._count.verifications} verified
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/stock-verification/campaigns/${campaign.id}`);
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
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

        {/* Create Campaign Form */}
        <CreateCampaignForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // Refresh the campaigns list after successful creation
            fetchCampaigns(currentPage, searchTerm, statusFilter);
          }}
        />
      </div>
    </div>
  );
}