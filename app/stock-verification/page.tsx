'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription, Progress, StatusIndicator } from '@/components/ui/design-system';
import { RefreshCw, Activity, Database, Users, CheckCircle, AlertTriangle, BarChart3, FileText, Shield, Play, List, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StockVerificationAnalytics from '@/components/stock-verification/StockVerificationAnalytics';
import RecentActivityWidget from '@/components/stock-verification/RecentActivityWidget';
import { useVerificationSocket } from '@/lib/websocket/verification-socket';

interface ModuleStatus {
  success: boolean;
  message: string;
  timestamp: string;
  version: string;
  environment: string;
  database: {
    connected: boolean;
    campaigns: number;
    totalUsers: number;
  };
  userContext?: {
    role: string;
    scope: string;
    location: string;
    firstName: string;
    lastName?: string;
  };
  features: {
    photoUpload: boolean;
    autoAssignment: boolean;
    caching: boolean;
    notifications: boolean;
  };
  endpoints: {
    [key: string]: string;
  };
  ui: {
    [key: string]: string;
  };
}

export default function StockVerificationDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;
  const isManagerial = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEAM_LEADER'].includes(userRole || '');

  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* New State for Reports */
  const [reportData, setReportData] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Fetch both system status and report data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [statusRes, reportRes, activityRes] = await Promise.all([
          fetch('/api/stock-verification'),
          fetch('/api/stock-verification/reports'),
          fetch('/api/stock-verification/verifications?limit=8')
        ]);

        const statusData = await statusRes.json();
        const reportDataJson = await reportRes.json();
        const activityData = await activityRes.json();

        if (statusData.success) setStatus(statusData);
        if (reportDataJson.success) setReportData(reportDataJson);
        if (activityData.success) setRecentActivity(activityData.data || []);

        if (!statusData.success && !reportDataJson.success) {
          setError('Failed to load dashboard data');
        }

      } catch (err) {
        setError('Failed to connect to API');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
        setReportLoading(false);
      }
    };

    fetchAllData();

    // Real-time updates via Pusher
    const { subscribeToVerifications } = useVerificationSocket();

    const unsubscribe = subscribeToVerifications((data: any) => {
      console.log('Real-time update received:', data);
      // Refresh data on any verification event
      fetchAllData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mx-auto"
              >
                <RefreshCw className="h-12 w-12 text-primary" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Loading Dashboard</h3>
                <p className="text-sm text-muted-foreground">Initializing analytics & system status...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Connection Error</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="destructive"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {status?.userContext?.scope === 'STATE' || status?.userContext?.scope === 'LGA'
                  ? `${status.userContext.location} Dashboard`
                  : 'Stock Verification Module'}
              </h1>
            </div>
            {isManagerial && (
              <Button
                onClick={() => router.push('/stock-verification/verifications/new')}
                variant="outline"
                className="ml-4"
              >
                <Play className="mr-2 h-4 w-4" /> Start Verification
              </Button>
            )}
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isManagerial
              ? "Manage campaigns, assignments, and monitor verification progress"
              : "Verify assets, manage assignments, and track your performance"
            }
          </p>
          <Badge variant="success" className="text-sm">
            <CheckCircle className="mr-1 h-3 w-3" />
            System Active
          </Badge>
        </motion.div>

        {/* Verifier Specific View */}
        {!isManagerial && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12"
          >
            {/* Primary Action: Start Verification */}
            <Card
              className="border-2 border-primary/20 bg-primary/5 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all group"
              onClick={() => router.push('/stock-verification/verifications/new')}
            >
              <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 space-y-4">
                <div className="p-4 bg-primary text-primary-foreground rounded-full group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">Start New Verification</h2>
                  <p className="text-gray-500 mt-2">Scan an asset QR code or enter details manually</p>
                </div>
              </CardContent>
            </Card>

            {/* Secondary Action: My Assignments */}
            <Card
              className="border-dashed border-2 hover:border-solid hover:border-blue-500 cursor-pointer transition-all group"
              onClick={() => router.push('/stock-verification/campaigns')} // Verifiers are redirected to their assignments or campaigns list
            >
              <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 space-y-4">
                <div className="p-4 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                  <List className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">My Assignments</h2>
                  <p className="text-gray-500 mt-2">View assets assigned to you for verification</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analytics Section - Visible to All (Verifiers see restricted data if API handles it, or simplify this) */}
        {isManagerial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
          >
            <div className="lg:col-span-2">
              <StockVerificationAnalytics data={reportData} loading={reportLoading} />
            </div>
            <div className="lg:col-span-1">
              <RecentActivityWidget data={recentActivity} loading={reportLoading} />
            </div>
          </motion.div>
        )}

        {/* Quick Links Row - Manager Only OR limited links for verifier */}
        {isManagerial ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Link href="/stock-verification/campaigns" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center p-6 bg-card rounded-xl border border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all cursor-pointer text-center h-full justify-center"
              >
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <Database className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Campaigns & Assignments</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage & Track</p>
              </motion.div>
            </Link>
            {/* Other manager links... */}
            <Link href="/stock-verification/verifications" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center p-6 bg-card rounded-xl border border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-all cursor-pointer text-center h-full justify-center"
              >
                <div className="p-3 bg-green-100 rounded-full mb-3">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Verifications</h3>
                <p className="text-sm text-muted-foreground mt-1">Log & Review</p>
              </motion.div>
            </Link>

            <Link href="/stock-verification/discrepancies" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center p-6 bg-card rounded-xl border border-t-4 border-t-yellow-500 shadow-sm hover:shadow-md transition-all cursor-pointer text-center h-full justify-center"
              >
                <div className="p-3 bg-yellow-100 rounded-full mb-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-lg">Discrepancies</h3>
                <p className="text-sm text-muted-foreground mt-1">Resolve Issues</p>
              </motion.div>
            </Link>

            <Link href="/stock-verification/reports" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center p-6 bg-card rounded-xl border border-t-4 border-t-purple-500 shadow-sm hover:shadow-md transition-all cursor-pointer text-center h-full justify-center"
              >
                <div className="p-3 bg-purple-100 rounded-full mb-3">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">Reports</h3>
                <p className="text-sm text-muted-foreground mt-1">Export Data</p>
              </motion.div>
            </Link>
          </motion.div>
        ) : (
          // Verifier Minor Links
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
          >
            <Link href="/stock-verification/verifications" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-row items-center p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-3 bg-gray-100 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">My Recent Verifications</h3>
                  <p className="text-xs text-muted-foreground mt-1">View history</p>
                </div>
              </motion.div>
            </Link>

            {/* Could add 'My Performance' or similar here later */}
            <Card className="bg-muted/10 border-dashed">
              <CardContent className="flex items-center p-4">
                <Activity className="h-5 w-5 text-muted-foreground mr-3" />
                <div className="text-sm text-muted-foreground">
                  Your performance stats will appear here
                </div>
              </CardContent>
            </Card>

          </motion.div>
        )}

        {/* System Information (Collapsed/Lower Priority) - Only for Managers */}
        {isManagerial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-muted/10 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center text-muted-foreground">
                  <Activity className="h-4 w-4 mr-2" /> System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${status.database.connected ? 'bg-success' : 'bg-destructive'}`} />
                    Database: {status.database.connected ? 'Connected' : 'Offline'}
                  </span>
                  <span className="flex items-center">
                    <Badge variant="outline" className="ml-2 font-mono text-xs">{status.version}</Badge>
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
}