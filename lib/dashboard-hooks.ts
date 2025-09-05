import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Types
type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'retired';

interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: Date;
  purchaseValue: number;
  currentValue: number;
  status: AssetStatus;
  location: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  assignedTo?: string;
  department?: string;
  warrantyExpiry?: Date;
  notes?: string;
}

interface Activity {
  id: string;
  type: 'asset' | 'maintenance' | 'user' | 'system' | 'depreciation';
  action: string;
  description: string;
  timestamp: Date;
  user?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: string;
  metadata?: Record<string, any>;
}

interface DashboardMetrics {
  totalAssets: number;
  totalValue: number;
  activeAssets: number;
  maintenanceNeeded: number;
  recentAssets: Asset[];
  recentActivities: Activity[];
  assetDistribution: {
    byCategory: Record<string, number>;
    byLocation: Record<string, number>;
    byStatus: Record<string, number>;
  };
  assetTrends: {
    labels: string[];
    values: number[];
  };
}

interface DashboardFilters {
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  status?: AssetStatus[];
  category?: string[];
  location?: string[];
  searchQuery?: string;
}

export function useDashboardData() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: 'month',
    status: [],
    category: [],
    location: [],
    searchQuery: ''
  });
  
  // Mock data - in a real app, this would come from an API
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAssets: 0,
    totalValue: 0,
    activeAssets: 0,
    maintenanceNeeded: 0,
    recentAssets: [],
    recentActivities: [],
    assetDistribution: {
      byCategory: {},
      byLocation: {},
      byStatus: {}
    },
    assetTrends: {
      labels: [],
      values: []
    }
  });

  // Generate sample data
  const generateSampleAssets = (count: number): Asset[] => {
    const categories = ['Laptops', 'Monitors', 'Phones', 'Furniture', 'Vehicles', 'Servers'];
    const locations = ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo', 'Edo', 'Delta', 'Enugu'];
    const statuses: AssetStatus[] = ['active', 'inactive', 'maintenance', 'retired'];
    const conditions = ['excellent', 'good', 'fair', 'poor'] as const;
    const manufacturers = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'Cisco', 'Microsoft'];
    const departments = ['IT', 'Finance', 'HR', 'Operations', 'Marketing', 'Sales'];
    
    return Array.from({ length: count }, (_, i) => {
      const purchaseDate = new Date();
      purchaseDate.setMonth(purchaseDate.getMonth() - Math.floor(Math.random() * 24));
      
      const purchaseValue = Math.floor(Math.random() * 10000) + 500;
      const yearsOld = (new Date().getFullYear() - purchaseDate.getFullYear());
      const depreciation = purchaseValue * 0.2 * yearsOld;
      const currentValue = Math.max(0, purchaseValue - depreciation);
      
      const nextMaintenance = new Date(purchaseDate);
      nextMaintenance.setMonth(nextMaintenance.getMonth() + 6 + Math.floor(Math.random() * 12));
      
      const lastMaintenance = new Date(purchaseDate);
      lastMaintenance.setMonth(lastMaintenance.getMonth() + 3);
      
      const warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 3);
      
      return {
        id: `AST-${1000 + i}`,
        name: `${manufacturers[i % manufacturers.length]} ${['Pro', 'Elite', 'Standard', 'Premium'][i % 4]} ${i + 1}`,
        category: categories[i % categories.length],
        purchaseDate,
        purchaseValue,
        currentValue,
        status: statuses[i % statuses.length] as AssetStatus,
        location: locations[i % locations.length],
        lastMaintenance: i % 3 === 0 ? lastMaintenance : undefined,
        nextMaintenance: i % 4 !== 0 ? nextMaintenance : undefined,
        condition: conditions[i % conditions.length],
        serialNumber: `SN-${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
        model: `MOD-${2020 + (i % 4)}`,
        manufacturer: manufacturers[i % manufacturers.length],
        assignedTo: i % 5 === 0 ? undefined : `user${i % 10}@example.com`,
        department: departments[i % departments.length],
        warrantyExpiry: i % 2 === 0 ? warrantyExpiry : undefined,
        notes: i % 3 === 0 ? 'Requires regular maintenance' : ''
      };
    });
  };

  // Generate sample activities
  const generateSampleActivities = (assets: Asset[], count: number): Activity[] => {
    const activityTypes = ['Created', 'Updated', 'Maintenance', 'Transferred', 'Depreciated', 'Audited'];
    const users = ['admin@example.com', 'manager@example.com', 'staff@example.com', 'auditor@example.com'];
    const statuses = ['success', 'warning', 'error', 'info'] as const;
    
    return Array.from({ length: count }, (_, i) => {
      const type = i % 4 === 0 ? 'asset' : i % 4 === 1 ? 'maintenance' : i % 4 === 2 ? 'user' : 'system';
      const action = activityTypes[i % activityTypes.length];
      const asset = assets[i % assets.length];
      const user = users[i % users.length];
      const status = statuses[i % statuses.length];
      
      let description = '';
      
      switch (type) {
        case 'asset':
          description = `${action} asset: ${asset.name}`;
          break;
        case 'maintenance':
          description = `Performed maintenance on ${asset.name}`;
          break;
        case 'user':
          description = `${user} ${action.toLowerCase()}d their profile`;
          break;
        case 'system':
          description = `System ${action.toLowerCase()} completed`;
          break;
      }
      
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - (i % 24));
      
      return {
        id: `ACT-${1000 + i}`,
        type,
        action,
        description,
        timestamp,
        user,
        status,
        metadata: {
          assetId: asset.id,
          assetName: asset.name,
          oldValue: i % 3 === 0 ? 'Old value' : undefined,
          newValue: i % 3 === 0 ? 'New value' : undefined
        }
      };
    });
  };

  // Calculate metrics from assets and activities
  const calculateMetrics = (assets: Asset[], activities: Activity[]): Omit<DashboardMetrics, 'recentAssets' | 'recentActivities'> => {
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const activeAssets = assets.filter(asset => asset.status === 'active').length;
    
    const now = new Date();
    const maintenanceNeeded = assets.filter(asset => 
      asset.nextMaintenance && new Date(asset.nextMaintenance) < now
    ).length;
    
    // Calculate distribution by category
    const byCategory = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate distribution by location
    const byLocation = assets.reduce((acc, asset) => {
      acc[asset.location] = (acc[asset.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate distribution by status
    const byStatus = assets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Generate trend data (last 12 months)
    const labels = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return date.toLocaleString('default', { month: 'short' });
    });
    
    const values = labels.map((_, i) => {
      const month = new Date().getMonth() - (11 - i);
      return Math.floor(totalAssets * (0.7 + Math.random() * 0.6));
    });
    
    return {
      totalAssets,
      totalValue,
      activeAssets,
      maintenanceNeeded,
      assetDistribution: {
        byCategory,
        byLocation,
        byStatus
      },
      assetTrends: {
        labels,
        values
      }
    };
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Generate sample data
        const sampleAssets = generateSampleAssets(48); // Generate 48 sample assets
        const sampleActivities = generateSampleActivities(sampleAssets, 50); // Generate 50 sample activities
        
        // Calculate metrics
        const calculatedMetrics = calculateMetrics(sampleAssets, sampleActivities);
        
        // Get recent assets and activities
        const recentAssets = [...sampleAssets]
          .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
          .slice(0, 5);
          
        const recentActivities = [...sampleActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        
        // Update state
        setAssets(sampleAssets);
        setActivities(sampleActivities);
        setMetrics({
          ...calculatedMetrics,
          recentAssets,
          recentActivities
        });
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setActivities(prevActivities => {
        if (prevActivities.length === 0) return prevActivities;
        
        const newActivity = {
          ...prevActivities[0],
          id: `ACT-${Date.now()}`,
          timestamp: new Date(),
          description: `New activity at ${new Date().toLocaleTimeString()}`
        };
        
        return [newActivity, ...prevActivities.slice(0, 9)];
      });
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Apply filters to assets
  const filteredAssets = useCallback(() => {
    return assets.filter(asset => {
      // Apply search query filter
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !asset.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !asset.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !asset.status.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !asset.model?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !asset.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply status filter
      if (filters.status && filters.status.length > 0 && !filters.status.includes(asset.status)) {
        return false;
      }
      
      // Apply category filter
      if (filters.category && filters.category.length > 0 && !filters.category.includes(asset.category)) {
        return false;
      }
      
      // Apply location filter
      if (filters.location && filters.location.length > 0 && !filters.location.includes(asset.location)) {
        return false;
      }
      
      // Apply date range filter
      if (filters.dateRange) {
        const cutoffDate = new Date();
        
        switch (filters.dateRange) {
          case 'week':
            cutoffDate.setDate(cutoffDate.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(cutoffDate.getMonth() - 1);
            break;
          case 'quarter':
            cutoffDate.setMonth(cutoffDate.getMonth() - 3);
            break;
          case 'year':
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
            break;
        }
        
        if (new Date(asset.purchaseDate) < cutoffDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [assets, searchQuery, filters]);

  // Action handlers
  const handleAddAsset = useCallback(() => {
    toast.info('Navigating to add asset form');
    router.push('/assets/new');
  }, [router]);

  const handleTransferAsset = useCallback((assetId?: string) => {
    if (assetId) {
      toast.info(`Initiating transfer for asset ${assetId}`, {
        action: {
          label: 'View',
          onClick: () => handleViewAsset(assetId)
        }
      });
    } else {
      toast.info('Initiating bulk transfer');
    }
  }, [handleViewAsset]);

  const handleExportReport = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Report exported as ${format.toUpperCase()}`, {
        description: 'Your download will start shortly',
        action: {
          label: 'View Exports',
          onClick: () => router.push('/reports')
        }
      });
    } catch (error) {
      toast.error('Failed to export report', {
        description: 'Please try again later'
      });
    }
  }, [router]);

  const handleFilterChange = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      
      // Update URL with filters
      const params = new URLSearchParams();
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (value) {
          params.set(key, value);
        }
      });
      
      // Update URL without page reload
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      
      return updatedFilters;
    });
  }, []);

  const handleViewAsset = useCallback((assetId: string) => {
    router.push(`/assets/${assetId}`);
  }, [router]);

  const handleToggleNotifications = useCallback(() => {
    setNotificationsEnabled(prev => {
      const newValue = !prev;
      
      // Log this activity
      const activity: Activity = {
        id: `ACT-${Date.now()}`,
        type: 'system',
        action: 'Notification Settings',
        description: `Notifications ${newValue ? 'enabled' : 'disabled'}`,
        timestamp: new Date(),
        status: 'info'
      };
      
      setActivities(prevActivities => [activity, ...prevActivities]);
      
      // Update metrics if needed
      setMetrics(prev => ({
        ...prev,
        recentActivities: [activity, ...prev.recentActivities.slice(0, 9)]
      }));
      
      return newValue;
    });
  }, []);

  // Format helpers
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const formatDate = useCallback((date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }, []);

  // Calculate derived metrics based on filtered assets
  const filteredMetrics = useCallback(() => {
    const filtered = filteredAssets();
    const totalValue = filtered.reduce((sum, asset) => sum + asset.currentValue, 0);
    const activeAssets = filtered.filter(asset => asset.status === 'active').length;
    
    const now = new Date();
    const maintenanceNeeded = filtered.filter(asset => 
      asset.nextMaintenance && new Date(asset.nextMaintenance) < now
    ).length;
    
    return {
      totalAssets: filtered.length,
      totalValue,
      activeAssets,
      maintenanceNeeded,
      recentAssets: [...filtered]
        .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
        .slice(0, 5)
    };
  }, [filteredAssets]);

  return {
    // State
    assets: filteredAssets(),
    activities: activities.slice(0, 10), // Only show recent activities
    metrics: {
      ...metrics,
      ...filteredMetrics()
    },
    isLoading,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange: (range: 'week' | 'month' | 'quarter' | 'year') => 
      handleFilterChange({ dateRange: range }),
    notificationsEnabled,
    filters,
    
    // Actions
    handleAddAsset,
    handleTransferAsset,
    handleExportReport,
    handleFilterChange,
    handleViewAsset,
    handleToggleNotifications,
    
    // Helpers
    formatCurrency,
    formatDate
  };
}
      },
    ];
    
    setActivities(sampleActivities);
  }, []);

  return {
    // State
    assets: filteredAssets(),
    activities,
    metrics,
    isLoading,
    dateRange,
    searchQuery,
    notificationsEnabled,
    
    // Actions
    setDateRange,
    setSearchQuery,
    handleAddAsset,
    handleTransferAsset,
    handleExportReport,
    handleFilterChange,
    handleViewAsset,
    handleToggleNotifications,
    
    // Formatting helpers
    formatCurrency: (value: number) => 
      new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value),
      
    formatDate: (date: Date) => format(date, 'MMM d, yyyy')
  };
}

// Context provider for dashboard state
export function useDashboardContext() {
  return useDashboardData();
}
