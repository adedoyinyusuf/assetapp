'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface AnalyticsProps {
    data: {
        stats: {
            totalVerifications: number;
            verifiedAssets: number;
            pendingVerifications: number;
            discrepanciesFound: number;
            missingAssets: number;
            damagedAssets: number;
        };
        campaigns: Array<{
            name: string;
            completionRate: number;
            discrepancyCount: number;
        }>;
    } | null;
    loading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF4444'];
const STATUS_COLORS = {
    verified: '#10B981', // Green
    pending: '#F59E0B',  // Amber
    discrepancy: '#EF4444', // Red
    missing: '#6B7280', // Gray
};

export default function StockVerificationAnalytics({ data, loading }: AnalyticsProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return null;

    // Prepare Pie Chart Data
    const statusData = [
        { name: 'Verified', value: data.stats.verifiedAssets, color: STATUS_COLORS.verified },
        { name: 'Pending', value: data.stats.pendingVerifications, color: STATUS_COLORS.pending },
        { name: 'Discrepancy', value: data.stats.discrepanciesFound, color: STATUS_COLORS.discrepancy },
        { name: 'Missing/Damaged', value: data.stats.missingAssets + data.stats.damagedAssets, color: STATUS_COLORS.missing },
    ].filter(item => item.value > 0);

    const hasStatusData = statusData.length > 0;

    // Prepare Campaign Progress Data (Top 5 Active) - Add ID to name to prevent duplicates
    const campaignData = data.campaigns
        .slice(0, 5)
        .map((c: any) => ({
            displayName: `${c.name.substring(0, 15)}... (#${c.id})`,
            fullName: c.name,
            Progress: Math.round(c.completionRate),
            Discrepancies: c.discrepancyCount
        }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Verification Status Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Verification Status</CardTitle>
                    <CardDescription>Overall breakdown of asset statuses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {hasStatusData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                        <p className="font-semibold text-sm mb-1" style={{ color: data.color }}>{data.name}</p>
                                                        <p className="text-gray-600 text-xs">
                                                            Count: <span className="font-mono font-bold">{data.value}</span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <PieChart width={100} height={100}>
                                    <Pie
                                        data={[{ value: 1 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={45}
                                        fill="#e5e7eb"
                                        dataKey="value"
                                        stroke="none"
                                    />
                                </PieChart>
                                <p className="text-sm mt-2">No verification data yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Campaign Progress */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Campaigns</CardTitle>
                    <CardDescription>Progress & discrepancy counts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {campaignData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={campaignData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        dataKey="displayName"
                                        type="category"
                                        width={140}
                                        tick={{ fontSize: 11, fill: '#6B7280' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                        <p className="font-semibold text-sm mb-2">{payload[0].payload.fullName}</p>
                                                        <div className="space-y-1">
                                                            <p className="text-xs flex items-center text-blue-600">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                                                Progress: {payload[0].value}%
                                                            </p>
                                                            <p className="text-xs flex items-center text-red-500">
                                                                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                                                Issues: {payload[1]?.value || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend verticalAlign="top" align="right" height={36} iconSize={8} />
                                    <Bar
                                        dataKey="Progress"
                                        fill="#3B82F6"
                                        radius={[0, 4, 4, 0]}
                                        name="Progress %"
                                        barSize={12}
                                    />
                                    {/* Separate Discrepancies into a visual indicator if possible, 
                                        or keep as bar but maybe strictly numeric if scale is weird? 
                                        For now, keeping as bar but giving it a distinct color. */}
                                    <Bar
                                        dataKey="Discrepancies"
                                        fill="#EF4444"
                                        radius={[0, 4, 4, 0]}
                                        name="Issues Found"
                                        barSize={12}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <BarChart width={100} height={100} data={[{ v: 100 }, { v: 60 }, { v: 80 }]}>
                                    <Bar dataKey="v" fill="#e5e7eb" />
                                </BarChart>
                                <p className="text-sm mt-2">No active campaigns found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
