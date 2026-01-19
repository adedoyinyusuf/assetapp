'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    dataType: 'campaigns' | 'verifications' | 'assets' | 'discrepancies';
}

export function ExportDialog({ open, onOpenChange, title, dataType }: ExportDialogProps) {
    const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [includeFields, setIncludeFields] = useState({
        basicInfo: true,
        photos: false,
        notes: true,
        location: true,
        timestamps: true
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            // Build query parameters
            const params = new URLSearchParams({
                format,
                ...(dateRange.from && { startDate: dateRange.from.toISOString() }),
                ...(dateRange.to && { endDate: dateRange.to.toISOString() }),
                fields: Object.entries(includeFields)
                    .filter(([_, value]) => value)
                    .map(([key]) => key)
                    .join(',')
            });

            // Make API call
            const response = await fetch(`/api/stock-verification/reports/export?type=${dataType}&${params}`);

            if (!response.ok) throw new Error('Export failed');

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${dataType}_export_${format}.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            onOpenChange(false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        {title || 'Export Data'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure export settings and download your data
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Format Selection */}
                    <div className="space-y-2">
                        <Label>Export Format</Label>
                        <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="excel">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        Excel (.xlsx)
                                    </div>
                                </SelectItem>
                                <SelectItem value="csv">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        CSV (.csv)
                                    </div>
                                </SelectItem>
                                <SelectItem value="pdf">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        PDF (.pdf)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                        <Label>Date Range (Optional)</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                value={dateRange.from?.toISOString().split('T')[0] || ''}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : undefined })}
                            />
                            <Input
                                type="date"
                                value={dateRange.to?.toISOString().split('T')[0] || ''}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : undefined })}
                            />
                        </div>
                    </div>

                    {/* Fields Selection */}
                    <div className="space-y-2">
                        <Label>Include Fields</Label>
                        <div className="space-y-2 border rounded-lg p-3">
                            {Object.entries(includeFields).map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={key}
                                        checked={value}
                                        onCheckedChange={(checked) =>
                                            setIncludeFields({ ...includeFields, [key]: checked as boolean })
                                        }
                                    />
                                    <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
