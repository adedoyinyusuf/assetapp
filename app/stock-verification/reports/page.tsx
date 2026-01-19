'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ReportStats {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalVerifications: number;
    verifiedAssets: number;
    pendingVerifications: number;
    discrepanciesFound: number;
    missingAssets: number;
    damagedAssets: number;
    verificationRate: number;
    discrepancyRate: number;
}

interface CampaignReport {
    id: number;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    targetAssetCount: number;
    verifiedCount: number;
    pendingCount: number;
    discrepancyCount: number;
    completionRate: number;
}

interface TrendData {
    date: string;
    verified: number;
    pending: number;
    discrepancies: number;
}

interface TeamPerformanceData {
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
    const router = useRouter();
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceData[]>([]);
    const [selectedCampaignForTeam, setSelectedCampaignForTeam] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            });

            const response = await fetch(`/api/stock-verification/reports?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }

            const data = await response.json();
            setStats(data.stats);
            setCampaigns(data.campaigns || []);

            // Generate trend data from campaigns
            if (data.campaigns && data.campaigns.length > 0) {
                const trends: TrendData[] = data.campaigns.map((campaign: CampaignReport) => ({
                    date: new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    verified: campaign.verifiedCount,
                    pending: campaign.pendingCount,
                    discrepancies: campaign.discrepancyCount,
                }));
                setTrendData(trends);

                // Set first campaign as default for team performance
                if (!selectedCampaignForTeam && data.campaigns[0]) {
                    setSelectedCampaignForTeam(data.campaigns[0].id);
                    fetchTeamPerformance(data.campaigns[0].id);
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching reports');
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamPerformance = async (campaignId: number) => {
        try {
            const response = await fetch(`/api/stock-verification/campaigns/${campaignId}/team-performance`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTeamPerformance(data.data || []);
                }
            }
        } catch (err) {
            console.error('Error fetching team performance:', err);
        }
    };

    const exportReport = async (format: 'pdf' | 'excel') => {
        try {
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                format,
            });

            const response = await fetch(`/api/stock-verification/reports/export?${params}`);

            if (!response.ok) {
                // Try to parse error message
                try {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to export report');
                } catch (e) {
                    if (e instanceof Error && e.message !== 'Failed to export report') throw e;
                    throw new Error('Failed to export report');
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `verification-report-${dateRange.startDate}-to-${dateRange.endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            alert(err.message || 'Failed to export report');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Verification Reports</h1>
                            <p className="mt-2 text-gray-600">
                                Comprehensive reports and analytics for stock verification campaigns
                            </p>
                        </div>
                        <Link
                            href="/stock-verification"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            ← Back to Overview
                        </Link>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => exportReport('pdf')}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                📄 Export PDF
                            </button>
                            <button
                                onClick={() => exportReport('excel')}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                📊 Export Excel
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Summary Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCampaigns}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📋</span>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-600">
                                {stats.activeCampaigns} active, {stats.completedCampaigns} completed
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVerifications}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">✅</span>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-600">
                                {stats.verifiedAssets} verified, {stats.pendingVerifications} pending
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Verification Rate</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.verificationRate.toFixed(1)}%</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📈</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-emerald-600 h-2 rounded-full transition-all"
                                        style={{ width: `${stats.verificationRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Discrepancies</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.discrepanciesFound}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-600">
                                {stats.missingAssets} missing, {stats.damagedAssets} damaged
                            </div>
                        </div>
                    </div>
                )}

                {/* Campaign Performance Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Campaign Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Campaign
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Target
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Verified
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pending
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discrepancies
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Completion
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            No campaigns found for the selected date range
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/stock-verification/campaigns/${campaign.id}`}
                                                    className="text-emerald-600 hover:text-emerald-900 font-medium"
                                                >
                                                    {campaign.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                    campaign.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                        campaign.status === 'PLANNED' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {campaign.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {campaign.targetAssetCount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                {campaign.verifiedCount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                                {campaign.pendingCount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                {campaign.discrepancyCount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className={`h-2 rounded-full ${campaign.completionRate >= 80 ? 'bg-green-600' :
                                                                campaign.completionRate >= 50 ? 'bg-yellow-600' :
                                                                    'bg-red-600'
                                                                }`}
                                                            style={{ width: `${campaign.completionRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {campaign.completionRate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Charts Section */}
                {campaigns.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Campaign Completion Chart */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Completion Rates</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={campaigns.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        interval={0}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="completionRate" fill="#10b981" name="Completion %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Status Distribution Pie Chart */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Active', value: campaigns.filter(c => c.status === 'ACTIVE').length },
                                            { name: 'Completed', value: campaigns.filter(c => c.status === 'COMPLETED').length },
                                            { name: 'Planned', value: campaigns.filter(c => c.status === 'PLANNED').length },
                                            { name: 'Cancelled', value: campaigns.filter(c => c.status === 'CANCELLED').length },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Active', value: campaigns.filter(c => c.status === 'ACTIVE').length },
                                            { name: 'Completed', value: campaigns.filter(c => c.status === 'COMPLETED').length },
                                            { name: 'Planned', value: campaigns.filter(c => c.status === 'PLANNED').length },
                                            { name: 'Cancelled', value: campaigns.filter(c => c.status === 'CANCELLED').length },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Trend Chart */}
                        {trendData.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Trends</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} name="Verified" />
                                        <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
                                        <Line type="monotone" dataKey="discrepancies" stroke="#ef4444" strokeWidth={2} name="Discrepancies" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Team Performance Charts */}
                        {teamPerformance.length > 0 && (
                            <>
                                <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
                                        <select
                                            value={selectedCampaignForTeam || ''}
                                            onChange={(e) => {
                                                const campaignId = parseInt(e.target.value);
                                                setSelectedCampaignForTeam(campaignId);
                                                fetchTeamPerformance(campaignId);
                                            }}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                        >
                                            {campaigns.map((campaign) => (
                                                <option key={campaign.id} value={campaign.id}>
                                                    {campaign.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={teamPerformance.slice(0, 10)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="userName"
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                                interval={0}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="completedVerifications" fill="#10b981" name="Completed" />
                                            <Bar dataKey="pendingVerifications" fill="#f59e0b" name="Pending" />
                                            <Bar dataKey="discrepancyCount" fill="#ef4444" name="Discrepancies" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency by Team Member</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={teamPerformance.slice(0, 10)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 100]} />
                                            <YAxis dataKey="userName" type="category" width={100} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Scores</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={teamPerformance.slice(0, 10)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 100]} />
                                            <YAxis dataKey="userName" type="category" width={100} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="qualityScore" fill="#8b5cf6" name="Quality Score" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Additional Insights */}
                {stats && (
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Condition Summary</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Missing Assets</span>
                                    <span className="text-red-600 font-semibold">{stats.missingAssets}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Damaged Assets</span>
                                    <span className="text-orange-600 font-semibold">{stats.damagedAssets}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Discrepancy Rate</span>
                                    <span className="text-yellow-600 font-semibold">{stats.discrepancyRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link
                                    href="/stock-verification/campaigns"
                                    className="block w-full px-4 py-2 text-center bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                                >
                                    View All Campaigns
                                </Link>
                                <Link
                                    href="/stock-verification/verifications"
                                    className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    View All Verifications
                                </Link>
                                <Link
                                    href="/stock-verification/discrepancies"
                                    className="block w-full px-4 py-2 text-center bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                                >
                                    View Discrepancies
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
