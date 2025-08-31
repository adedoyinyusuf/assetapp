'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { getFeatureFlags } from '@/lib/auth/roles';

export function useFeatureFlags() {
  const { data: session } = useSession();
  
  const featureFlags = useMemo(() => {
    if (!session?.user?.role) {
      return ['basic_dashboard'];
    }
    
    return getFeatureFlags(session.user.role);
  }, [session?.user?.role]);
  
  const hasFeature = (feature: string): boolean => {
    return featureFlags.includes(feature);
  };
  
  const hasAnyFeature = (features: string[]): boolean => {
    return features.some(feature => hasFeature(feature));
  };
  
  const hasAllFeatures = (features: string[]): boolean => {
    return features.every(feature => hasFeature(feature));
  };
  
  return {
    featureFlags,
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    isLoading: !session
  };
}

// Convenience hooks for specific feature groups
export function useAnalyticsFeatures() {
  const { hasFeature } = useFeatureFlags();
  
  return {
    hasBasicAnalytics: hasFeature('basic_analytics'),
    hasAdvancedAnalytics: hasFeature('advanced_analytics'),
    hasExportAnalytics: hasFeature('export_analytics'),
    hasAnyAnalytics: hasFeature('basic_analytics') || hasFeature('advanced_analytics')
  };
}

export function useSearchFeatures() {
  const { hasFeature } = useFeatureFlags();
  
  return {
    hasBasicSearch: hasFeature('basic_search'),
    hasAdvancedSearch: hasFeature('advanced_search'),
    hasSaveSearches: hasFeature('save_searches'),
    hasAnySearch: hasFeature('basic_search') || hasFeature('advanced_search')
  };
}

export function useRealTimeFeatures() {
  const { hasFeature } = useFeatureFlags();
  
  return {
    hasRealTimeUpdates: hasFeature('real_time_updates'),
    hasWebSocketAccess: hasFeature('real_time_updates')
  };
}

export function useAdminFeatures() {
  const { hasFeature } = useFeatureFlags();
  
  return {
    hasUserManagement: hasFeature('user_management'),
    hasSystemSettings: hasFeature('system_settings'),
    hasRoleManagement: hasFeature('role_management'),
    hasAnyAdmin: hasFeature('user_management') || hasFeature('system_settings') || hasFeature('role_management')
  };
}
