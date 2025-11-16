'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CampaignDetails {
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
  instructions?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  assignedStates: number[];
  assignedLgas: number[];
  assignedCategories: number[];
  creator: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  _count: {
    verifications: number;
    assignments: number;
    discrepancies: number;
  };
}

const statusColors = {
  PLANNED: 'bg-blue-100 text-blue-800 border-blue-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  ARCHIVED: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusIcons = {
  PLANNED: '📋',
  ACTIVE: '🟢',
  PAUSED: '⏸️',
  COMPLETED: '✅',
  CANCELLED: '❌',
  ARCHIVED: '📦',
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const campaignId = params?.id;

  useEffect(() => {
    if (!campaignId) return;

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/stock-verification/campaigns/${campaignId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Campaign not found');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setCampaign(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch campaign');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const handleCampaignAction = async (action: string) => {
    if (!campaign || !campaignId) return;

    try {
      setActionLoading(action);
      
      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        // Refresh campaign data
        const updatedResponse = await fetch(`/api/stock-verification/campaigns/${campaignId}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          if (updatedData.success) {
            setCampaign(updatedData.data);
          }
        }
      } else {
        toast.error(result.error || 'Failed to execute action');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Failed to execute action');
    } finally {
      setActionLoading(null);
    }
  };

  const getAvailableActions = () => {
    if (!campaign) return [];
    
    switch (campaign.status) {
      case 'PLANNED':
        return ['start', 'cancel'];
      case 'ACTIVE':
        return ['pause', 'complete', 'cancel'];
      case 'PAUSED':
        return ['resume', 'cancel'];
      case 'COMPLETED':
        return ['archive'];
      case 'CANCELLED':
        return ['archive'];
      case 'ARCHIVED':
        return [];
      default:
        return [];
    }
  };

  const getActionStyle = (action: string) => {
    const baseStyle = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (action) {
      case 'start':
      case 'resume':
        return `${baseStyle} bg-green-600 hover:bg-green-700 text-white`;
      case 'pause':
        return `${baseStyle} bg-yellow-600 hover:bg-yellow-700 text-white`;
      case 'complete':
        return `${baseStyle} bg-blue-600 hover:bg-blue-700 text-white`;
      case 'cancel':
        return `${baseStyle} bg-red-600 hover:bg-red-700 text-white`;
      case 'archive':
        return `${baseStyle} bg-gray-600 hover:bg-gray-700 text-white`;
      default:
        return `${baseStyle} bg-gray-600 hover:bg-gray-700 text-white`;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'start': return '▶️';
      case 'pause': return '⏸️';
      case 'resume': return '▶️';
      case 'complete': return '✅';
      case 'cancel': return '❌';
      case 'archive': return '📦';
      default: return '⚙️';
    }
  };

  const getActionLabel = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1) + ' Campaign';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Error Loading Campaign</h3>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button 
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining(campaign.endDate);
  const isExpired = daysRemaining < 0;
  const completionRate = campaign.targetAssetCount ? 
    (campaign.actualAssetCount / campaign.targetAssetCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {campaign.name}
                  </h1>
                  <p className="text-gray-600">
                    Campaign #{campaign.id} • Created by {campaign.creator.firstName} {campaign.creator.lastName}
                  </p>
                </div>
                <div className={`inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium ${statusColors[campaign.status]}`}>
                  <span className="mr-2 text-base">{statusIcons[campaign.status]}</span>
                  {campaign.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Target Assets</p>
                <p className="text-2xl font-bold text-gray-900">{campaign.targetAssetCount?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{campaign.actualAssetCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{completionRate.toFixed(1)}% complete</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Discrepancies</p>
                <p className="text-2xl font-bold text-gray-900">{campaign._count.discrepancies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                isExpired ? 'bg-red-100' : daysRemaining <= 7 ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                <span className={`text-xl ${
                  isExpired ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-blue-600'
                }`}>📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isExpired ? 'Expired' : 'Days Remaining'}
                </p>
                <p className={`text-2xl font-bold ${
                  isExpired ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {isExpired ? Math.abs(daysRemaining) : daysRemaining}
                </p>
                <p className="text-xs text-gray-500">
                  {isExpired ? 'days ago' : 'days left'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Progress</h3>
            <span className="text-sm text-gray-600">{campaign.verificationProgress.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(campaign.verificationProgress, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Start: {formatDate(campaign.startDate)}</span>
            <span>End: {formatDate(campaign.endDate)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Campaign Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">📋 Campaign Details</h3>
            
            <div className="space-y-4">
              {campaign.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900 mt-1">{campaign.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900 mt-1">{formatDate(campaign.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900 mt-1">{formatDate(campaign.endDate)}</p>
                </div>
              </div>

              {campaign.budget && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Budget</label>
                  <p className="text-gray-900 mt-1 text-lg font-semibold">
                    {formatCurrency(campaign.budget)}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900 mt-1">{formatDateTime(campaign.createdAt)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-gray-900 mt-1">{formatDateTime(campaign.updatedAt)}</p>
              </div>
            </div>

            {campaign.instructions && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-600">Instructions</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{campaign.instructions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Assignment Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">👥 Assignment Summary</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Team Members</label>
                <p className="text-2xl font-bold text-gray-900 mt-1">{campaign._count.assignments}</p>
                <p className="text-xs text-gray-500">people assigned</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">States Coverage</label>
                <p className="text-gray-900 mt-1">
                  {campaign.assignedStates.length > 0 
                    ? `${campaign.assignedStates.length} states assigned`
                    : 'All states'
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">LGAs Coverage</label>
                <p className="text-gray-900 mt-1">
                  {campaign.assignedLgas.length > 0 
                    ? `${campaign.assignedLgas.length} LGAs assigned`
                    : 'All LGAs'
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Categories Coverage</label>
                <p className="text-gray-900 mt-1">
                  {campaign.assignedCategories.length > 0 
                    ? `${campaign.assignedCategories.length} categories assigned`
                    : 'All categories'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Campaign State Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Campaign Actions</h3>
            <div className="space-y-3">
              {getAvailableActions().map((action) => (
                <button
                  key={action}
                  onClick={() => handleCampaignAction(action)}
                  disabled={actionLoading === action}
                  className={getActionStyle(action)}
                >
                  {actionLoading === action ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{getActionIcon(action)}</span>
                      <span>{getActionLabel(action)}</span>
                    </>
                  )}
                </button>
              ))}
              {getAvailableActions().length === 0 && (
                <p className="text-gray-500 text-sm italic">No actions available for this campaign status.</p>
              )}
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Management</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => router.push(`/stock-verification/campaigns/${campaign.id}/verifications`)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <span>📋</span>
                <span>View Verifications ({campaign._count.verifications})</span>
              </button>
              <button
                onClick={() => router.push(`/stock-verification/campaigns/${campaign.id}/assignments`)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <span>👥</span>
                <span>Manage Assignments ({campaign._count.assignments})</span>
              </button>
              <button
                onClick={() => router.push(`/stock-verification/campaigns/${campaign.id}/discrepancies`)}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <span>⚠️</span>
                <span>View Discrepancies ({campaign._count.discrepancies})</span>
              </button>
              <button
                onClick={() => router.push(`/stock-verification/campaigns/${campaign.id}/reports`)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <span>📊</span>
                <span>Generate Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
}