'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserRole, 
  Task, 
  canPerformTask,
  getFeatureFlags 
} from '@/lib/auth/roles';
import { 
  Package, 
  Search, 
  BarChart3, 
  Users, 
  Settings, 
  Activity,
  FileText,
  TrendingUp,
  Shield,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface RoleBasedWelcomeProps {
  role: UserRole;
  userName?: string;
}

export function RoleBasedWelcome({ role, userName }: RoleBasedWelcomeProps) {
  const featureFlags = getFeatureFlags(role);
  
  const getRoleInfo = () => {
    switch (role) {
      case UserRole.VIEWER:
        return {
          title: 'Viewer Dashboard',
          description: 'You have read-only access to view assets, reports, and basic analytics.',
          color: 'bg-blue-100 text-blue-800',
          icon: <Eye className="h-6 w-6" />,
          capabilities: [
            'View asset details and locations',
            'Access basic reports and analytics',
            'Search and filter assets',
            'View movement history'
          ]
        };
        
      case UserRole.OPERATOR:
        return {
          title: 'Operator Dashboard',
          description: 'You can manage assets, record movements, and access operational tools.',
          color: 'bg-green-100 text-green-800',
          icon: <Activity className="h-6 w-6" />,
          capabilities: [
            'Create and update assets',
            'Record asset movements',
            'Access basic analytics',
            'Real-time updates via WebSocket'
          ]
        };
        
      case UserRole.MANAGER:
        return {
          title: 'Manager Dashboard',
          description: 'You have oversight capabilities including asset management and user supervision.',
          color: 'bg-purple-100 text-purple-800',
          icon: <TrendingUp className="h-6 w-6" />,
          capabilities: [
            'Full asset management',
            'Approve asset movements',
            'Access advanced reports',
            'User oversight capabilities'
          ]
        };
        
      case UserRole.AUDITOR:
        return {
          title: 'Auditor Dashboard',
          description: 'You have comprehensive access to audit trails, reports, and compliance tools.',
          color: 'bg-orange-100 text-orange-800',
          icon: <Shield className="h-6 w-6" />,
          capabilities: [
            'View all assets and movements',
            'Access audit logs and trails',
            'Export comprehensive reports',
            'Compliance monitoring tools'
          ]
        };
        
      case UserRole.ADMIN:
        return {
          title: 'Administrator Dashboard',
          description: 'You have full system access including user management and system configuration.',
          color: 'bg-red-100 text-red-800',
          icon: <Settings className="h-6 w-6" />,
          capabilities: [
            'Full system access',
            'User and role management',
            'System configuration',
            'Advanced analytics and reporting'
          ]
        };
        
      case UserRole.SUPER_ADMIN:
        return {
          title: 'System Administrator Dashboard',
          description: 'You have complete control over the system including roles, permissions, and all features.',
          color: 'bg-gray-100 text-gray-800',
          icon: <Shield className="h-6 w-6" />,
          capabilities: [
            'Complete system control',
            'Role and permission management',
            'System administration',
            'All features and capabilities'
          ]
        };
        
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to your dashboard.',
          color: 'bg-gray-100 text-gray-800',
          icon: <Activity className="h-6 w-6" />,
          capabilities: []
        };
    }
  };
  
  const getQuickActions = () => {
    const actions = [];
    
    if (canPerformTask(role, Task.VIEW_ASSET_DETAILS)) {
      actions.push({
        title: 'View Assets',
        href: '/assets',
        icon: <Package className="h-4 w-4" />,
        description: 'Browse and search assets'
      });
    }
    
    if (canPerformTask(role, Task.CREATE_ASSET)) {
      actions.push({
        title: 'Add Asset',
        href: '/assets/add',
        icon: <Package className="h-4 w-4" />,
        description: 'Register new asset'
      });
    }
    
    if (canPerformTask(role, Task.VIEW_BASIC_REPORTS)) {
      actions.push({
        title: 'Reports',
        href: '/reports',
        icon: <FileText className="h-4 w-4" />,
        description: 'View asset reports'
      });
    }
    
    if (canPerformTask(role, Task.VIEW_BASIC_ANALYTICS)) {
      actions.push({
        title: 'Analytics',
        href: '/dashboard?tab=analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'View analytics dashboard'
      });
    }
    
    if (canPerformTask(role, Task.BASIC_SEARCH)) {
      actions.push({
        title: 'Search',
        href: '/dashboard?tab=search',
        icon: <Search className="h-4 w-4" />,
        description: 'Search assets and data'
      });
    }
    
    if (canPerformTask(role, Task.VIEW_USERS)) {
      actions.push({
        title: 'User Management',
        href: '/admin/users',
        icon: <Users className="h-4 w-4" />,
        description: 'Manage system users'
      });
    }
    
    if (canPerformTask(role, Task.MANAGE_SYSTEM_SETTINGS)) {
      actions.push({
        title: 'Settings',
        href: '/admin/settings',
        icon: <Settings className="h-4 w-4" />,
        description: 'System configuration'
      });
    }
    
    return actions;
  };
  
  const roleInfo = getRoleInfo();
  const quickActions = getQuickActions();
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userName || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            {roleInfo.description}
          </p>
        </div>
        <Badge className={`px-4 py-2 text-sm font-medium ${roleInfo.color}`}>
          <div className="flex items-center gap-2">
            {roleInfo.icon}
            {roleInfo.title}
          </div>
        </Badge>
      </div>
      
      {/* Role Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roleInfo.capabilities.map((capability, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {capability}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex-col justify-start p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {action.icon}
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">
                      {action.description}
                    </p>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Available Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {featureFlags.map((feature, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1">
                {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
