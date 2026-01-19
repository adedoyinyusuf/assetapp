'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface StatusData {
    name: string;
    value: number;
    color: string;
}

interface StatusDistributionChartProps {
    data: StatusData[];
    isLoading?: boolean;
}

const COLORS = {
    VERIFIED: '#22c55e',
    PENDING: '#eab308',
    DISCREPANCY: '#ef4444',
    'IN_PROGRESS': '#3b82f6'
};

export function StatusDistributionChart({ data, isLoading }: StatusDistributionChartProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5" />
                        Verification Status
                    </CardTitle>
                    <CardDescription>Loading status distribution...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80 flex items-center justify-center bg-muted/30 rounded-lg animate-pulse">
                        <p className="text-muted-foreground">Loading chart...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5" />
                        Verification Status
                    </CardTitle>
                    <CardDescription>No status data available</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                        <p>No verifications recorded yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Verification Status
                </CardTitle>
                <CardDescription>
                    Distribution of {total} verifications
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
