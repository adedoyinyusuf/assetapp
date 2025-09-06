'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  Calendar,
  Filter,
  ArrowLeft,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  formats: Array<'csv' | 'json' | 'pdf'>;
  icon: any;
  apiEndpoint: string;
  fields: string[];
}

const exportOptions: ExportOption[] = [
  {
    id: 'assets',
    title: 'Asset Records',
    description: 'Export all asset data including categories, locations, and valuations',
    formats: ['csv', 'json', 'pdf'],
    icon: Database,
    apiEndpoint: '/api/assets',
    fields: ['name', 'category', 'location', 'purchaseValue', 'currentValue', 'status', 'purchaseDate']
  },
  {
    id: 'depreciation',
    title: 'Depreciation Records',
    description: 'Export depreciation calculations and asset value changes',
    formats: ['csv', 'json'],
    icon: FileSpreadsheet,
    apiEndpoint: '/api/depreciation',
    fields: ['assetName', 'year', 'depreciation', 'currentValue', 'depreciationPercentage']
  },
  {
    id: 'categories',
    title: 'Categories',
    description: 'Export category information and asset counts',
    formats: ['csv', 'json'],
    icon: FileText,
    apiEndpoint: '/api/categories',
    fields: ['name', 'description', 'assetCount']
  },
  {
    id: 'locations',
    title: 'Locations',
    description: 'Export states and LGA information with asset distribution',
    formats: ['csv', 'json'],
    icon: FileText,
    apiEndpoint: '/api/locations',
    fields: ['name', 'type', 'assetCount', 'parentLocation']
  }
];

interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
}

export default function ExportReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedExport, setSelectedExport] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Load export history
  useEffect(() => {
    if (session) {
      loadExportHistory();
    }
  }, [session]);

  const loadExportHistory = async () => {
    try {
      const response = await fetch('/api/exports');
      if (response.ok) {
        const data = await response.json();
        setExportJobs(data.exports || []);
      }
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  };

  // Handle export selection
  const handleExportSelection = (exportId: string) => {
    setSelectedExport(exportId);
    const option = exportOptions.find(opt => opt.id === exportId);
    if (option) {
      setSelectedFields(option.fields);
      setSelectedFormat(option.formats[0]);
    }
  };

  // Handle field toggle
  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  // Handle export
  const handleExport = async () => {
    if (!selectedExport || !selectedFormat) {
      toast({
        title: 'Error',
        description: 'Please select an export type and format',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFields.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one field to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);

      const option = exportOptions.find(opt => opt.id === selectedExport);
      if (!option) return;

      const params = new URLSearchParams({
        format: selectedFormat,
        fields: selectedFields.join(','),
        ...(dateRange.from && { from: dateRange.from }),
        ...(dateRange.to && { to: dateRange.to }),
        ...(filterCategory && { category: filterCategory }),
      });

      const response = await fetch(`${option.apiEndpoint}?export=true&${params}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const filename = `${selectedExport}-export-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
        
        if (selectedFormat === 'pdf' || contentType?.includes('application/pdf')) {
          // Handle PDF download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          // Handle CSV/JSON download
          const data = await response.json();
          let content;
          let mimeType;

          if (selectedFormat === 'csv') {
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              const headers = selectedFields.join(',');
              const rows = data.data.map((item: any) =>
                selectedFields.map(field => {
                  const value = getNestedValue(item, field);
                  return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value || '';
                }).join(',')
              );
              content = [headers, ...rows].join('\n');
            } else {
              content = selectedFields.join(',') + '\n';
            }
            mimeType = 'text/csv';
          } else {
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
          }

          const blob = new Blob([content], { type: mimeType });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }

        toast({
          title: 'Success',
          description: `${option.title} exported successfully`,
        });

        // Add to export history
        const newJob: ExportJob = {
          id: Date.now().toString(),
          type: selectedExport,
          format: selectedFormat,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
        setExportJobs(prev => [newJob, ...prev]);

      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Export failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to get nested object values
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const selectedOption = exportOptions.find(opt => opt.id === selectedExport);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Download className="h-8 w-8 text-primary" />
              Export Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Export your data in various formats
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Select Export Type */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Export Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedExport === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleExportSelection(option.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {option.formats.map(format => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {selectedExport === option.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Configuration */}
          {selectedOption && (
            <Card>
              <CardHeader>
                <CardTitle>Export Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedOption.formats.map(format => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Field Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fields to Export</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {selectedOption.fields.map(field => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={field}
                          checked={selectedFields.includes(field)}
                          onCheckedChange={() => toggleField(field)}
                        />
                        <label
                          htmlFor={field}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                        >
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                {selectedExport === 'assets' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From Date</label>
                      <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">To Date</label>
                      <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                {(selectedExport === 'assets' || selectedExport === 'depreciation') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Category (Optional)</label>
                    <Input
                      placeholder="Enter category name"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    />
                  </div>
                )}

                {/* Export Button */}
                <Button
                  onClick={handleExport}
                  disabled={isExporting || selectedFields.length === 0}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export {selectedOption.title}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Export History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exportJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No exports yet
                </p>
              ) : (
                <div className="space-y-3">
                  {exportJobs.slice(0, 10).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {exportOptions.find(opt => opt.id === job.type)?.title || job.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()} • {job.format.toUpperCase()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          job.status === 'completed' 
                            ? 'default' 
                            : job.status === 'failed' 
                            ? 'destructive' 
                            : 'secondary'
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
