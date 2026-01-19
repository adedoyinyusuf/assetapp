'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Assignment {
  id: number;
  userId: number;
  role: 'VERIFIER' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN' | 'AUDITOR' | 'TEAM_LEADER' | 'SENIOR_VERIFIER' | 'QUALITY_CONTROLLER' | 'ASSISTANT_VERIFIER' | 'OBSERVER';
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
  role: string; // Added role field
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
  TEAM_LEADER: 'bg-indigo-100 text-indigo-800',
  SENIOR_VERIFIER: 'bg-blue-200 text-blue-900',
  ASSISTANT_VERIFIER: 'bg-blue-50 text-blue-600',
  OBSERVER: 'bg-gray-100 text-gray-800',
  QUALITY_CONTROLLER: 'bg-teal-100 text-teal-800',
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
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [lgas, setLgas] = useState<{ id: number; name: string; stateId: number }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission feedback
  const [userContext, setUserContext] = useState<any>(null); // User context for role-based scoping

  const supervisorRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'SUPERVISOR',
    'TEAM_LEADER',
    'SENIOR_VERIFIER',
    'QUALITY_CONTROLLER'
  ];

  // Combine assigned users and available users to get all potential supervisors
  const potentialSupervisors = useMemo(() => {
    const assignedSupervisors = assignments
      .filter(a => supervisorRoles.includes(a.role))
      .map(a => ({
        id: a.user.id,
        name: `${a.user.firstName} ${a.user.lastName}`,
        role: a.role.replace('_', ' '),
        email: a.user.email
      }));

    const availableSupervisors = availableUsers
      .filter(u => supervisorRoles.includes(u.role)) // Check u.role exists on User interface
      .map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role.replace('_', ' '),
        email: u.email
      }));

    // Merge and deduplicate by ID
    const all = [...assignedSupervisors];
    availableSupervisors.forEach(u => {
      if (!all.find(existing => existing.id === u.id)) {
        all.push(u);
      }
    });

    return all.sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments, availableUsers]);

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
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setAvailableUsers(data);
      } else if (data.success && Array.isArray(data.data)) {
        setAvailableUsers(data.data);
      } else if (data.data && Array.isArray(data.data)) {
        setAvailableUsers(data.data);
      } else {
        setAvailableUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback: try alternative endpoint
      try {
        const altResponse = await fetch('/api/users');
        const altData = await altResponse.json();
        const users = Array.isArray(altData) ? altData : (altData.data || []);
        setAvailableUsers(users);
      } catch (e) {
        console.error('Error with fallback user fetch:', e);
      }
    }
  };

  const fetchStates = async () => {
    try {
      const response = await fetch('/api/states');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setStates(data.data || data || []);
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchLGAs = async (stateIds: number[]) => {
    if (stateIds.length === 0) {
      setLgas([]);
      return;
    }
    try {
      const allLGAs: { id: number; name: string; stateId: number }[] = [];
      for (const stateId of stateIds) {
        const response = await fetch(`/api/states/${stateId}/lgas`);
        if (response.ok) {
          const data = await response.json();
          const stateLGAs = (data.data || data || []).map((lga: any) => ({
            id: lga.id,
            name: lga.name,
            stateId: stateId,
          }));
          allLGAs.push(...stateLGAs);
        }
      }
      setLgas(allLGAs);
    } catch (err) {
      console.error('Error fetching LGAs:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCategories(data.data || data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId) {
      alert('Please select a Team Member'); // Fallback to alert
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Creating assignment with data:', formData);
      const payload = {
        userId: parseInt(formData.userId),
        role: formData.role,
        stateIds: formData.stateIds,
        lgaIds: formData.lgaIds,
        categoryIds: formData.categoryIds,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        dailyTarget: formData.dailyTarget ? parseInt(formData.dailyTarget) : undefined,
        totalTarget: formData.totalTarget ? parseInt(formData.totalTarget) : undefined,
        instructions: formData.instructions || undefined,
        mobileAccess: formData.mobileAccess,
        offlineAccess: formData.offlineAccess,
        reportingTo: formData.reportingTo ? parseInt(formData.reportingTo) : undefined,
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
        setShowCreateForm(false);
        resetForm();
        fetchAssignments();
        toast.success('Assignment created successfully');
      } else {
        let errorMessage = data.error || 'Failed to create assignment';
        if (data.details && Array.isArray(data.details)) {
          const details = data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n');
          errorMessage += `\n${details}`;
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create assignment';
      alert('Error: ' + msg); // Force visible error
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedUserIds = formData.userId.split(',').map(id => id.trim()).filter(id => id);

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      const promises = selectedUserIds.map(userId => {
        const payload = {
          userId: parseInt(userId),
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

        return fetch(`/api/stock-verification/campaigns/${campaignId}/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      });

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} assignment(s)`);
        if (failCount > 0) {
          toast.warning(`${failCount} assignment(s) failed`);
        }
        setShowBulkForm(false);
        resetForm();
        fetchAssignments();
      } else {
        throw new Error('All assignments failed');
      }
    } catch (err) {
      console.error('Error creating bulk assignments:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create bulk assignments');
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
      fetchStates();
      fetchCategories();
      // Fetch user context for scoping
      fetch('/api/stock-verification')
        .then(res => res.json())
        .then(data => {
          if (data.userContext) setUserContext(data.userContext);
        })
        .catch(err => console.error('Failed to fetch user context:', err));
    }
  }, [campaignId]);

  useEffect(() => {
    if (formData.stateIds.length > 0) {
      fetchLGAs(formData.stateIds);
    } else {
      setLgas([]);
    }
  }, [formData.stateIds]);

  useEffect(() => {
    if (showPerformance && assignments.length > 0) {
      fetchTeamPerformance();
    }
  }, [showPerformance, assignments.length]);

  // Filter states based on user context (e.g., State Manager sees only their state)
  const filteredStates = useMemo(() => {
    if (userContext?.stateId && states.length > 0) {
      return states.filter(s => s.id === userContext.stateId);
    }
    return states;
  }, [states, userContext]);

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
                onClick={() => setShowBulkForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📋 Bulk Assign
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

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Completion vs Pending</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performance.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="userName"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completedVerifications" fill="#10b981" name="Completed" />
                      <Bar dataKey="pendingVerifications" fill="#f59e0b" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Efficiency Scores</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performance.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="userName" type="category" width={80} fontSize={10} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                        <div className="font-medium text-gray-900">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </div>
                        <div className="flex gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[assignment.role]}`}>
                            {assignment.role}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[assignment.status]}`}>
                            {assignment.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        {assignment.user.email}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
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

        {/* Bulk Assignment Modal */}
        {showBulkForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Bulk Assign Team Members</h3>
                  <button
                    onClick={() => {
                      setShowBulkForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleBulkAssignment} className="p-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Bulk Assignment:</strong> Select multiple users to assign them all with the same settings.
                    Separate user IDs with commas (e.g., &quot;1,2,3&quot;) or use the checkboxes below.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* User Selection - Multiple */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Members * (Select multiple)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {availableUsers.map((user) => (
                        <label key={user.id} className="flex items-center space-x-2 py-2 hover:bg-gray-50 rounded px-2">
                          <input
                            type="checkbox"
                            checked={formData.userId.includes(user.id.toString())}
                            onChange={(e) => {
                              const userIdStr = user.id.toString();
                              if (e.target.checked) {
                                const currentIds = formData.userId ? formData.userId.split(',').map(id => id.trim()) : [];
                                if (!currentIds.includes(userIdStr)) {
                                  setFormData({ ...formData, userId: [...currentIds, userIdStr].join(',') });
                                }
                              } else {
                                const currentIds = formData.userId ? formData.userId.split(',').map(id => id.trim()) : [];
                                setFormData({ ...formData, userId: currentIds.filter(id => id !== userIdStr).join(',') });
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-900">
                            {user.firstName} {user.lastName} - {user.email}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {formData.userId ? formData.userId.split(',').filter(id => id.trim()).length : 0} user(s)
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role * (Applied to all)
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="TEAM_LEADER">Team Leader</option>
                      <option value="SENIOR_VERIFIER">Senior Verifier</option>
                      <option value="VERIFIER">Verifier</option>
                      <option value="ASSISTANT_VERIFIER">Assistant Verifier</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="OBSERVER">Observer</option>
                      <option value="QUALITY_CONTROLLER">Quality Controller</option>
                    </select>
                  </div>

                  {/* Supervisor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reports To (Applied to all)
                    </label>
                    <select
                      value={formData.reportingTo}
                      onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">No supervisor</option>
                      {potentialSupervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name} ({supervisor.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Includes all Managers/Leads, even if not yet assigned to this campaign.
                    </p>
                  </div>

                  {/* Targets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Target (Applied to all)
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
                      Total Target (Applied to all)
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
                      Start Date (Applied to all)
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
                      End Date (Applied to all)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* State Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned States (Applied to all)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {filteredStates.map((state) => (
                        <label key={state.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.stateIds.includes(state.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, stateIds: [...formData.stateIds, state.id] });
                              } else {
                                setFormData({
                                  ...formData,
                                  stateIds: formData.stateIds.filter(id => id !== state.id),
                                  lgaIds: formData.lgaIds.filter(id => {
                                    const lga = lgas.find(l => l.id === id);
                                    return lga && lga.stateId !== state.id;
                                  })
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-900">{state.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* LGA Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned LGAs (Optional, Applied to all)
                    </label>
                    {lgas.length === 0 ? (
                      <p className="text-sm text-gray-500">Select states first to see LGAs</p>
                    ) : (
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {lgas.map((lga) => (
                          <label key={lga.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={formData.lgaIds.includes(lga.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, lgaIds: [...formData.lgaIds, lga.id] });
                                } else {
                                  setFormData({ ...formData, lgaIds: formData.lgaIds.filter(id => id !== lga.id) });
                                }
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-900">{lga.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Categories (Optional, Applied to all)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, categoryIds: [...formData.categoryIds, category.id] });
                              } else {
                                setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== category.id) });
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-900">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions (Applied to all)
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Special instructions for these assignments..."
                    />
                  </div>

                  {/* Access Options */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Options (Applied to all)
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
                      setShowBulkForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Create {formData.userId ? formData.userId.split(',').filter(id => id.trim()).length : 0} Assignment(s)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                      <option value="TEAM_LEADER">Team Leader</option>
                      <option value="SENIOR_VERIFIER">Senior Verifier</option>
                      <option value="VERIFIER">Verifier</option>
                      <option value="ASSISTANT_VERIFIER">Assistant Verifier</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="OBSERVER">Observer</option>
                      <option value="QUALITY_CONTROLLER">Quality Controller</option>
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
                      {potentialSupervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name} ({supervisor.role})
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

                  {/* State Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned States
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {filteredStates.map((state) => (
                        <label key={state.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.stateIds.includes(state.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, stateIds: [...formData.stateIds, state.id] });
                              } else {
                                setFormData({
                                  ...formData,
                                  stateIds: formData.stateIds.filter(id => id !== state.id),
                                  lgaIds: formData.lgaIds.filter(id => {
                                    const lga = lgas.find(l => l.id === id);
                                    return lga && lga.stateId !== state.id;
                                  })
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-900">{state.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* LGA Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned LGAs (Optional)
                    </label>
                    {lgas.length === 0 ? (
                      <p className="text-sm text-gray-500">Select states first to see LGAs</p>
                    ) : (
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {lgas.map((lga) => (
                          <label key={lga.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={formData.lgaIds.includes(lga.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, lgaIds: [...formData.lgaIds, lga.id] });
                                } else {
                                  setFormData({ ...formData, lgaIds: formData.lgaIds.filter(id => id !== lga.id) });
                                }
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-900">{lga.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Categories (Optional)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, categoryIds: [...formData.categoryIds, category.id] });
                              } else {
                                setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== category.id) });
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-900">{category.name}</span>
                        </label>
                      ))}
                    </div>
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
                    type="button"
                    onClick={handleCreateAssignment}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Assignment'}
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