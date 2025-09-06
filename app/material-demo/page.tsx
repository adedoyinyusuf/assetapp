'use client';

import React, { useState } from 'react';
import { MaterialButton } from '@/components/ui/material-button';
import { MaterialCard, MaterialCardHeader, MaterialCardTitle, MaterialCardContent, MaterialCardDescription } from '@/components/ui/material-card';
import { MaterialDashboard } from '@/components/MaterialDashboard';
import { MaterialDashboardCard } from '@/components/dashboard/MaterialDashboardCard';
import { 
  Package, 
  Heart,
  Download,
  Settings,
  Play,
  Pause,
  Star,
  Share,
  Bookmark,
  MoreHorizontal,
  Palette
} from 'lucide-react';

const mockDashboardData = {
  totalAssets: 1247,
  totalValue: 45600000,
  totalUsers: 23,
  assetMovements: 12,
  categories: 8,
  states: 15,
  recentAssets: [
    { id: 1, name: 'Dell Laptop XPS 15', category: { name: 'IT Equipment' }, state: { name: 'Lagos' }, purchaseValue: 850000, createdAt: new Date() },
    { id: 2, name: 'Office Chair', category: { name: 'Furniture' }, state: { name: 'Abuja' }, purchaseValue: 125000, createdAt: new Date() },
    { id: 3, name: 'Toyota Camry 2023', category: { name: 'Vehicles' }, state: { name: 'Rivers' }, purchaseValue: 12500000, createdAt: new Date() },
  ]
};

export default function MaterialDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-md-surface">
      <div className="container mx-auto px-4 py-8 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-display-large font-normal text-md-on-surface">
            Material 3 Components
          </h1>
          <p className="text-body-large text-md-on-surface-variant max-w-2xl mx-auto">
            Explore our modern Material You design system implementation with dynamic colors, 
            elevated surfaces, and smooth interactions.
          </p>
        </div>

        {/* Button Showcase */}
        <MaterialCard variant="elevated" className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-title-large font-medium text-md-on-surface mb-2">
                Button Variants
              </h2>
              <p className="text-body-medium text-md-on-surface-variant">
                Material 3 buttons with proper elevation, state layers, and motion.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Filled Buttons */}
              <div className="space-y-4">
                <h3 className="text-title-medium font-medium">Filled</h3>
                <div className="space-y-3">
                  <MaterialButton variant="filled">
                    <Package className="h-5 w-5" />
                    Primary Action
                  </MaterialButton>
                  <MaterialButton variant="filled" disabled>
                    Disabled State
                  </MaterialButton>
                </div>
              </div>

              {/* Tonal Buttons */}
              <div className="space-y-4">
                <h3 className="text-title-medium font-medium">Filled Tonal</h3>
                <div className="space-y-3">
                  <MaterialButton variant="filled-tonal">
                    <Settings className="h-5 w-5" />
                    Secondary Action
                  </MaterialButton>
                  <MaterialButton variant="filled-tonal" size="sm">
                    Small Size
                  </MaterialButton>
                </div>
              </div>

              {/* Other Variants */}
              <div className="space-y-4">
                <h3 className="text-title-medium font-medium">Other Variants</h3>
                <div className="space-y-3">
                  <MaterialButton variant="outlined">
                    <Download className="h-5 w-5" />
                    Outlined
                  </MaterialButton>
                  <MaterialButton variant="text">
                    Text Button
                  </MaterialButton>
                  <MaterialButton variant="elevated">
                    <Star className="h-5 w-5" />
                    Elevated
                  </MaterialButton>
                </div>
              </div>
            </div>
          </div>
        </MaterialCard>

        {/* Card Showcase */}
        <MaterialCard variant="elevated" className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-title-large font-medium text-md-on-surface mb-2">
                Card Variants
              </h2>
              <p className="text-body-medium text-md-on-surface-variant">
                Elevated surfaces with different variants and interactive states.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MaterialCard variant="filled">
                <MaterialCardHeader>
                  <MaterialCardTitle>Filled Card</MaterialCardTitle>
                  <MaterialCardDescription>
                    Default filled variant with subtle background
                  </MaterialCardDescription>
                </MaterialCardHeader>
                <MaterialCardContent>
                  <p className="text-body-medium">
                    This card uses the filled variant with Material 3 surface colors.
                  </p>
                </MaterialCardContent>
              </MaterialCard>

              <MaterialCard variant="outlined">
                <MaterialCardHeader>
                  <MaterialCardTitle>Outlined Card</MaterialCardTitle>
                  <MaterialCardDescription>
                    Clean outlined variant
                  </MaterialCardDescription>
                </MaterialCardHeader>
                <MaterialCardContent>
                  <p className="text-body-medium">
                    Outlined cards are great for secondary content areas.
                  </p>
                </MaterialCardContent>
              </MaterialCard>

              <MaterialCard variant="elevated" interactive>
                <MaterialCardHeader>
                  <MaterialCardTitle>Interactive Card</MaterialCardTitle>
                  <MaterialCardDescription>
                    Hover and click for interactions
                  </MaterialCardDescription>
                </MaterialCardHeader>
                <MaterialCardContent>
                  <p className="text-body-medium">
                    This card has interactive states with hover effects.
                  </p>
                </MaterialCardContent>
              </MaterialCard>
            </div>
          </div>
        </MaterialCard>

        {/* Dashboard Cards Showcase */}
        <MaterialCard variant="elevated" className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-title-large font-medium text-md-on-surface mb-2">
                Dashboard Cards
              </h2>
              <p className="text-body-medium text-md-on-surface-variant">
                Specialized cards for displaying metrics and key information.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MaterialDashboardCard
                title="Primary Metric"
                value="1,234"
                icon={<Package className="h-6 w-6" />}
                description="Important KPI"
                trend={{ value: 12, label: "from last month", positive: true }}
                variant="primary"
                interactive
              />
              
              <MaterialDashboardCard
                title="Secondary Metric"
                value="₦45.2M"
                icon={<Heart className="h-6 w-6" />}
                description="Revenue data"
                trend={{ value: 5, label: "from last quarter", positive: false }}
                variant="secondary"
                interactive
              />
              
              <MaterialDashboardCard
                title="Tertiary Metric"
                value="98.5%"
                icon={<Star className="h-6 w-6" />}
                description="Success rate"
                variant="tertiary"
                size="compact"
              />
              
              <MaterialDashboardCard
                title="Loading State"
                value="..."
                icon={<MoreHorizontal className="h-6 w-6" />}
                loading={true}
              />
            </div>
          </div>
        </MaterialCard>

        {/* Complete Dashboard */}
        <MaterialCard variant="elevated" className="p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-title-large font-medium text-md-on-surface mb-2">
                  Complete Dashboard
                </h2>
                <p className="text-body-medium text-md-on-surface-variant">
                  Full dashboard implementation with all Material 3 components.
                </p>
              </div>
              <MaterialButton variant="outlined" size="sm">
                <Palette className="h-4 w-4" />
                View Source
              </MaterialButton>
            </div>
            
            <MaterialDashboard data={mockDashboardData} />
          </div>
        </MaterialCard>

        {/* Color System Preview */}
        <MaterialCard variant="elevated" className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-title-large font-medium text-md-on-surface mb-2">
                Color System
              </h2>
              <p className="text-body-medium text-md-on-surface-variant">
                Material 3 dynamic color tokens in action.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-md-primary rounded-lg"></div>
                <p className="text-label-small">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-md-secondary rounded-lg"></div>
                <p className="text-label-small">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-md-tertiary rounded-lg"></div>
                <p className="text-label-small">Tertiary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-md-error rounded-lg"></div>
                <p className="text-label-small">Error</p>
              </div>
            </div>
          </div>
        </MaterialCard>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-md-outline-variant">
          <p className="text-body-medium text-md-on-surface-variant">
            Material 3 implementation for NPC Asset Management System
          </p>
          <p className="text-body-small text-md-on-surface-variant mt-2">
            Built with Next.js, Tailwind CSS, and Material You design principles
          </p>
        </div>
      </div>
    </div>
  );
}
