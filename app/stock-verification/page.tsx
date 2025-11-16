'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription, Progress, StatusIndicator } from '@/components/ui/design-system';
import { RefreshCw, Activity, Database, Users, CheckCircle, AlertTriangle, BarChart3, FileText, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/stock-verification');
        const data = await response.json();
        
        if (data.success) {
          setStatus(data);
        } else {
          setError(data.error || 'Failed to load module status');
        }
      } catch (err) {
        setError('Failed to connect to Stock Verification API');
        console.error('Error fetching status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
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
                <h3 className="text-lg font-semibold">Loading Stock Verification Module</h3>
                <p className="text-sm text-muted-foreground">Please wait while we initialize the system...</p>
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
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Stock Verification Module
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete asset verification and discrepancy management system with real-time analytics
          </p>
          <Badge variant="success" className="text-sm">
            <CheckCircle className="mr-1 h-3 w-3" />
            System Active
          </Badge>
        </motion.div>

        {/* Status Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="hover:shadow-elevation-3 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-success/10 rounded-full">
                  <Activity className="h-6 w-6 text-success" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Module Status</p>
                  <StatusIndicator status="online">Active</StatusIndicator>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevation-3 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  status.database.connected 
                    ? 'bg-success/10' 
                    : 'bg-destructive/10'
                }`}>
                  <Database className={`h-6 w-6 ${
                    status.database.connected 
                      ? 'text-success' 
                      : 'text-destructive'
                  }`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Database</p>
                  <StatusIndicator status={status.database.connected ? 'online' : 'offline'}>
                    {status.database.connected ? 'Connected' : 'Disconnected'}
                  </StatusIndicator>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevation-3 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{status.database.campaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevation-3 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{status.database.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features and Quick Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Features Status</span>
              </CardTitle>
              <CardDescription>Current module capabilities and configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(status.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="font-medium capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Badge variant={enabled ? 'success' : 'secondary'}>
                      {enabled ? (
                        <><CheckCircle className="mr-1 h-3 w-3" />Enabled</>
                      ) : (
                        <>Disabled</>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-accent" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Navigate to key system functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Link href="/stock-verification/campaigns">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
                  >
                    <BarChart3 className="h-5 w-5 text-accent group-hover:text-primary mr-3" />
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary">Campaigns</p>
                      <p className="text-sm text-muted-foreground">Manage verification campaigns</p>
                    </div>
                  </motion.div>
                </Link>
                
                <Link href="/stock-verification/verifications">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
                  >
                    <Shield className="h-5 w-5 text-success group-hover:text-primary mr-3" />
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary">Verifications</p>
                      <p className="text-sm text-muted-foreground">View asset verifications</p>
                    </div>
                  </motion.div>
                </Link>
                
                <Link href="/stock-verification/discrepancies">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center p-4 rounded-lg border hover:border-warning/50 hover:bg-warning/5 transition-all group cursor-pointer"
                  >
                    <AlertTriangle className="h-5 w-5 text-warning group-hover:text-warning mr-3" />
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-warning">Discrepancies</p>
                      <p className="text-sm text-muted-foreground">Track issues and problems</p>
                    </div>
                  </motion.div>
                </Link>
                
                <Link href="/stock-verification/reports">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
                  >
                    <FileText className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary">Reports & Analytics</p>
                      <p className="text-sm text-muted-foreground">Comprehensive reporting tools</p>
                    </div>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <span>System Information</span>
              </CardTitle>
              <CardDescription>Current system status and configuration details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Version</p>
                  <Badge variant="outline" className="font-mono">{status.version}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Environment</p>
                  <Badge variant={status.environment === 'production' ? 'destructive' : 'warning'} className="capitalize">
                    {status.environment}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-mono bg-muted/30 px-2 py-1 rounded">
                    {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Development Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Implementation Status</span>
              </CardTitle>
              <CardDescription>Complete Stock Verification system implementation progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-primary font-semibold">85%</span>
                  </div>
                  <Progress value={85} className="h-3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-success flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completed Features
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="mr-2 h-3 w-3 text-success" />Campaign Management System</li>
                      <li className="flex items-center"><CheckCircle className="mr-2 h-3 w-3 text-success" />Asset Assignment Engine</li>
                      <li className="flex items-center"><CheckCircle className="mr-2 h-3 w-3 text-success" />Analytics & Reporting</li>
                      <li className="flex items-center"><CheckCircle className="mr-2 h-3 w-3 text-success" />Team Management</li>
                      <li className="flex items-center"><CheckCircle className="mr-2 h-3 w-3 text-success" />API Infrastructure</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-accent flex items-center">
                      <Activity className="mr-2 h-4 w-4" />
                      In Development
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><Activity className="mr-2 h-3 w-3 text-accent" />User Interface Components</li>
                      <li className="flex items-center"><Activity className="mr-2 h-3 w-3 text-accent" />Mobile App Integration</li>
                      <li className="flex items-center"><Activity className="mr-2 h-3 w-3 text-accent" />Real-time Notifications</li>
                      <li className="flex items-center"><Activity className="mr-2 h-3 w-3 text-accent" />Advanced Analytics</li>
                      <li className="flex items-center"><Activity className="mr-2 h-3 w-3 text-accent" />Workflow Automation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}