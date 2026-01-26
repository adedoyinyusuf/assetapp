'use client';

import { calculateDepreciationSchedule } from '@/lib/depreciation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

interface DepreciationScheduleProps {
    purchaseValue: number;
    salvageValue?: number;
    usefulLife: number;
    purchaseDate: string | Date; // Accept string for easier serialization
}

export function DepreciationSchedule({
    purchaseValue,
    salvageValue = 0,
    usefulLife,
    purchaseDate
}: DepreciationScheduleProps) {

    const pDate = new Date(purchaseDate);
    const schedule = calculateDepreciationSchedule(purchaseValue, salvageValue, usefulLife, pDate);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-indigo-600" />
                    <CardTitle>Depreciation Schedule</CardTitle>
                </div>
                <CardDescription>
                    Straight-line projection over {usefulLife} years.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Year</TableHead>
                                <TableHead>Opening Value</TableHead>
                                <TableHead>Expense</TableHead>
                                <TableHead>Accumulated</TableHead>
                                <TableHead className="text-right">Closing Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((row) => (
                                <TableRow key={row.year}>
                                    <TableCell className="font-medium">{row.year}</TableCell>
                                    <TableCell>{formatCurrency(row.openBookValue)}</TableCell>
                                    <TableCell className="text-red-600">({formatCurrency(row.depreciationExpense)})</TableCell>
                                    <TableCell>{formatCurrency(row.accumulatedDepreciation)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(row.closingBookValue)}</TableCell>
                                </TableRow>
                            ))}
                            {schedule.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        Unable to calculate schedule (Missing useful life or value).
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
