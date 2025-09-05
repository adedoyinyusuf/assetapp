import { format, subDays, subMonths } from 'date-fns';

// Format currency values
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format large numbers (e.g., 1.5K, 2.3M)
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

// Generate sample data for charts
export function generateTimeSeriesData(days: number = 30) {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'MMM dd'),
      value: Math.floor(Math.random() * 100) + 50,
    });
  }
  
  return data;
}

// Generate sample data for pie/donut charts
export function generatePieData(categories: string[]) {
  return categories.map(category => ({
    name: category,
    value: Math.floor(Math.random() * 100) + 10,
    color: getRandomColor(),
  }));
}

// Generate a random color
function getRandomColor() {
  const colors = [
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#06B6D4', // cyan-500
    '#EC4899', // pink-500
    '#14B8A6', // teal-500
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// Generate date range options for filters
export const dateRanges = [
  { id: 'today', label: 'Today', range: 1 },
  { id: 'week', label: 'Last 7 days', range: 7 },
  { id: 'month', label: 'Last 30 days', range: 30 },
  { id: 'quarter', label: 'Last 90 days', range: 90 },
  { id: 'year', label: 'This year', range: 365 },
];

// Format date for display
export function formatDate(date: Date | string, formatStr: string = 'MMM dd, yyyy'): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, formatStr);
}

// Get start and end dates for a given range
export function getDateRange(range: 'today' | 'week' | 'month' | 'quarter' | 'year') {
  const now = new Date();
  let startDate: Date;
  
  switch (range) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = subDays(now, 7);
      break;
    case 'month':
      startDate = subMonths(now, 1);
      break;
    case 'quarter':
      startDate = subMonths(now, 3);
      break;
    case 'year':
      startDate = subMonths(now, 12);
      break;
    default:
      startDate = subMonths(now, 1);
  }
  
  return {
    startDate,
    endDate: new Date(),
  };
}
