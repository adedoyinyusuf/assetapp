'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';

interface Assignment {
  id: number;
  userId: number;
  role: 'VERIFIER' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN' | 'AUDITOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'COMPLETED';
  stateIds: number[];
  lgaIds: number[];
  categoryIds: number[];
  startDate: string | null;
  endDate: string | null;
  dailyTarget: number | null;
  totalTarget: number | null;
  completedCount: number;
  instructions: string | null;
  mobileAccess: boolean;
  offlineAccess: boolean;
  reportingTo: number | null;
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  supervisor?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface TeamPerformance {
  userId: number;
  userName: string;
  role: string;
  totalAssigned: number;
  completedVerifications: number;
  pendingVerifications: number;
  discrepancyCount: number;
  averageVerificationTime: number;
  qualityScore: number;
  efficiency: number;
  dailyTarget: number;
  totalTarget: number;
}

const roleColors = {
  VERIFIER: 'bg-blue-100 text-blue-800',
  SUPERVISOR: 'bg-green-100 text-green-800',
  MANAGER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  AUDITOR: 'bg-yellow-100 text-yellow-800',
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function CampaignAssignmentsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = parseInt(params.id as string);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [performance, setPerformance] = useState<TeamPerformance[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    role: 'VERIFIER' as const,
    stateIds: [] as number[],
    lgaIds: [] as number[],
    categoryIds: [] as number[],
    startDate: '',
    endDate: '',
    dailyTarget: '',
    totalTarget: '',
    instructions: '',
    mobileAccess: true,
    offlineAccess: false,
    reportingTo: '',
  });

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/assignments`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch assignments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPerformance = async () => {
    try {
      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/team-performance`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        setPerformance(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch team performance');
      }
    } catch (err) {
      console.error('Error fetching team performance:', err);
      toast.error('Failed to load team performance data');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users?role=verifier');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableUsers(data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        userId: parseInt(formData.userId),
        role: formData.role,
        stateIds: formData.stateIds,
        lgaIds: formData.lgaIds,
        categoryIds: formData.categoryIds,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        dailyTarget: formData.dailyTarget ? parseInt(formData.dailyTarget) : null,
        totalTarget: formData.totalTarget ? parseInt(formData.totalTarget) : null,
        instructions: formData.instructions || null,
        mobileAccess: formData.mobileAccess,
        offlineAccess: formData.offlineAccess,
        reportingTo: formData.reportingTo ? parseInt(formData.reportingTo) : null,
      };

      const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Assignment created successfully');
        setShowCreateForm(false);
        resetForm();
        fetchAssignments();
      } else {
        throw new Error(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment');
    }
  };

  const handleUpdateAssignment = async (assignmentId: number, updates: Partial<Assignment>) => {
    try {
      const response = await fetch(`/api/stock-verification/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Assignment updated successfully');
        setEditingAssignment(null);
        fetchAssignments();
      } else {
        throw new Error(data.error || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const response = await fetch(`/api/stock-verification/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Assignment deleted successfully');
        fetchAssignments();
      } else {
        throw new Error(data.error || 'Failed to delete assignment');
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      role: 'VERIFIER',
      stateIds: [],
      lgaIds: [],
      categoryIds: [],
      startDate: '',
      endDate: '',
      dailyTarget: '',
      totalTarget: '',
      instructions: '',
      mobileAccess: true,
      offlineAccess: false,
      reportingTo: '',
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      fetchAssignments();
      fetchAvailableUsers();
    }
  }, [campaignId]);

  useEffect(() => {
    if (showPerformance && assignments.length > 0) {
      fetchTeamPerformance();
    }
  }, [showPerformance, assignments.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
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
                <span>Team Assignments</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                👥 Team Assignments
              </h1>
              <p className="text-gray-600">
                Manage team assignments and roles for {campaign?.name}
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowPerformance(!showPerformance)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📊 Performance
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ Add Assignment
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

        {/* Performance Overview */}
        {showPerformance && performance.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Overview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Team Member</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Assigned</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Completed</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Efficiency</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Quality Score</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {performance.map((member) => (
                    <tr key={member.userId}>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">{member.userName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[member.role as keyof typeof roleColors]}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-900">{member.totalAssigned}</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-900">{member.completedVerifications}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="text-sm font-medium text-gray-900">{member.efficiency}%</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, member.efficiency)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm font-medium text-gray-900">{member.qualityScore}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-900">{member.averageVerificationTime}min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-3">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Assignments</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => fetchAssignments()}
                className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Assignments ({assignments.length})</h3>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team assignments yet</h3>
              <p className="text-gray-600 mb-6">
                Assign team members to this campaign to start verification work
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Add First Assignment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="font-medium text-gray-900">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[assignment.role]}`}>
                          {assignment.role}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[assignment.status]}`}>
                          {assignment.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {assignment.user.email}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {assignment.dailyTarget && (
                          <div>Daily Target: <span className="font-medium">{assignment.dailyTarget}</span></div>
                        )}
                        {assignment.totalTarget && (
                          <div>Total Target: <span className="font-medium">{assignment.totalTarget}</span></div>
                        )}
                        <div>Completed: <span className="font-medium text-green-600">{assignment.completedCount}</span></div>
                        {assignment.startDate && (
                          <div>Start: <span className="font-medium">{formatDate(assignment.startDate)}</span></div>
                        )}
                        {assignment.endDate && (
                          <div>End: <span className="font-medium">{formatDate(assignment.endDate)}</span></div>
                        )}
                      </div>

                      {assignment.instructions && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Instructions:</span> {assignment.instructions}
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        {assignment.mobileAccess && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            📱 Mobile
                          </span>
                        )}
                        {assignment.offlineAccess && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            📴 Offline
                          </span>
                        )}
                        {assignment.supervisor && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            👨‍💼 Reports to {assignment.supervisor.firstName} {assignment.supervisor.lastName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingAssignment(assignment)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => router.push(`/api/stock-verification/users/${assignment.userId}/assignments`)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Assignment Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Create New Assignment</h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateAssignment} className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* User Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Member *
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select a user</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="VERIFIER">Verifier</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="MANAGER">Manager</option>
                      <option value="AUDITOR">Auditor</option>
                    </select>
                  </div>

                  {/* Supervisor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reports To
                    </label>
                    <select
                      value={formData.reportingTo}
                      onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">No supervisor</option>
                      {assignments
                        .filter(a => a.role === 'SUPERVISOR' || a.role === 'MANAGER')
                        .map((supervisor) => (
                          <option key={supervisor.userId} value={supervisor.userId}>
                            {supervisor.user.firstName} {supervisor.user.lastName}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Targets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.dailyTarget}
                      onChange={(e) => setFormData({ ...formData, dailyTarget: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalTarget}
                      onChange={(e) => setFormData({ ...formData, totalTarget: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 100"
                    />
                  </div>

                  {/* Dates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Special instructions for this assignment..."
                    />
                  </div>

                  {/* Access Options */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Options
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.mobileAccess}
                          onChange={(e) => setFormData({ ...formData, mobileAccess: e.target.checked })}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Mobile access</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.offlineAccess}
                          onChange={(e) => setFormData({ ...formData, offlineAccess: e.target.checked })}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Offline access</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Create Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}