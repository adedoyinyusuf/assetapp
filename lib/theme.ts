// Theme configuration for the dashboard
export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    secondary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    success: {
      50: '#f0fdf4',
      500: '#10b981',
      700: '#047857',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      700: '#b91c1c',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  spacing: {
    '0': '0px',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '32': '8rem',
    '40': '10rem',
    '48': '12rem',
    '56': '14rem',
    '64': '16rem',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
};

// Card variants
export const cardVariants = {
  default: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  primary: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
  success: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
  warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30',
  error: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30',
  info: 'bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/30 dark:to-sky-900/30',
};

// Button variants
export const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-purple-600 hover:bg-purple-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  error: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-200',
  link: 'bg-transparent hover:underline text-blue-600 dark:text-blue-400 p-0 h-auto',
};

// Text colors
export const textColors = {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-600 dark:text-gray-300',
  muted: 'text-gray-500 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
};

// Background colors
export const bgColors = {
  primary: 'bg-white dark:bg-gray-900',
  secondary: 'bg-gray-50 dark:bg-gray-800',
  success: 'bg-green-50 dark:bg-green-900/30',
  warning: 'bg-amber-50 dark:bg-amber-900/30',
  error: 'bg-red-50 dark:bg-red-900/30',
  info: 'bg-blue-50 dark:bg-blue-900/30',
};
