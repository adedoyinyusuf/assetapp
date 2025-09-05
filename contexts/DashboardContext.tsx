'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useDashboardData } from '@/lib/dashboard-hooks';

// Create the context with a default value
const DashboardContext = createContext<ReturnType<typeof useDashboardData> | null>(null);

// Provider component
export function DashboardProvider({ children }: { children: ReactNode }) {
  const dashboardData = useDashboardData();
  
  return (
    <DashboardContext.Provider value={dashboardData}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
