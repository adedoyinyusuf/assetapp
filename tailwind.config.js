/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.css",
  ],
  safelist: [
    'bg-background',
    'text-foreground',
    'border-border',
    'bg-card',
    'text-card-foreground',
    'bg-popover',
    'text-popover-foreground',
    'bg-primary',
    'text-primary-foreground',
    'bg-secondary',
    'text-secondary-foreground',
    'bg-destructive',
    'text-destructive-foreground',
    'bg-muted',
    'text-muted-foreground',
    'bg-accent',
    'text-accent-foreground',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Material 3 Typography Scale
      fontSize: {
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0', fontWeight: '400' }],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0', fontWeight: '400' }],
        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0', fontWeight: '400' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0', fontWeight: '400' }],
        'headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0', fontWeight: '400' }],
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '400' }],
        'title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
      },
      
      // Enhanced Shadows with Theme Colors
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px 0 rgba(36, 48, 16, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(36, 48, 16, 0.1), 0 1px 2px 0 rgba(36, 48, 16, 0.06)',
        'md': '0 4px 6px -1px rgba(36, 48, 16, 0.1), 0 2px 4px -1px rgba(36, 48, 16, 0.06)',
        'lg': '0 10px 15px -3px rgba(36, 48, 16, 0.1), 0 4px 6px -2px rgba(36, 48, 16, 0.05)',
        'xl': '0 20px 25px -5px rgba(36, 48, 16, 0.1), 0 10px 10px -5px rgba(36, 48, 16, 0.04)',
        '2xl': '0 25px 50px -12px rgba(36, 48, 16, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(36, 48, 16, 0.06)',
        'focus': '0 0 0 3px rgba(135, 163, 48, 0.25)',
        'hover': '0 4px 12px -2px rgba(36, 48, 16, 0.15)',
        // Material 3 Elevation Shadows (updated with theme colors)
        'elevation-0': 'none',
        'elevation-1': '0px 1px 2px 0px rgba(36, 48, 16, 0.3), 0px 1px 3px 1px rgba(36, 48, 16, 0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(36, 48, 16, 0.3), 0px 2px 6px 2px rgba(36, 48, 16, 0.15)',
        'elevation-3': '0px 1px 3px 0px rgba(36, 48, 16, 0.3), 0px 4px 8px 3px rgba(36, 48, 16, 0.15)',
        'elevation-4': '0px 2px 3px 0px rgba(36, 48, 16, 0.3), 0px 6px 10px 4px rgba(36, 48, 16, 0.15)',
        'elevation-5': '0px 4px 4px 0px rgba(36, 48, 16, 0.3), 0px 8px 12px 6px rgba(36, 48, 16, 0.15)',
      },
      
      // Theme Gradients
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #87a330 0%, #a1c349 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #2a3c24 0%, #87a330 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #cd5d67 0%, #ba1f33 100%)',
        'gradient-secondary-hover': 'linear-gradient(135deg, #91171f 0%, #cd5d67 100%)',
        'gradient-hero': 'linear-gradient(135deg, #243010 0%, #2a3c24 100%)',
        'gradient-card': 'linear-gradient(180deg, #ffffff 0%, rgba(202, 213, 147, 0.05) 100%)',
        'gradient-background': 'linear-gradient(180deg, #ffffff 0%, rgba(202, 213, 147, 0.1) 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #243010 0%, #2a3c24 100%)',
        'gradient-success': 'linear-gradient(135deg, #87a330 0%, #a1c349 100%)',
        'gradient-error': 'linear-gradient(135deg, #ba1f33 0%, #cd5d67 100%)',
      },
      
      // Material 3 Animation Curves
      transitionTimingFunction: {
        'emphasis-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'emphasis-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        'standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
        'standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
        'legacy-decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
        'legacy-accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      
      // Material 3 Animation Durations
      transitionDuration: {
        'short1': '50ms',
        'short2': '100ms',
        'short3': '150ms',
        'short4': '200ms',
        'medium1': '250ms',
        'medium2': '300ms',
        'medium3': '350ms',
        'medium4': '400ms',
        'long1': '450ms',
        'long2': '500ms',
        'long3': '550ms',
        'long4': '600ms',
        'extra-long1': '700ms',
        'extra-long2': '800ms',
        'extra-long3': '900ms',
        'extra-long4': '1000ms',
      },
      
      colors: {
        // New Color Palette - Green & Red Theme
        'pakistan-green': '#243010',
        'apple-green': '#87a330',
        'yellow-green': '#a1c349',
        'sage': '#cad593',
        'cal-poly-green': '#2a3c24',
        'chocolate-cosmos': '#410b13',
        'indian-red': '#cd5d67',
        'red-ncs': '#ba1f33',
        'chocolate-cosmos-2': '#421820',
        'carmine': '#91171f',
        
        // Updated Primary Color Scale (Green Theme)
        primary: {
          DEFAULT: '#87a330', // apple-green
          50: '#f0f4e4',
          100: '#dfe8c4',
          200: '#cad593', // sage
          300: '#a1c349', // yellow-green
          400: '#87a330', // apple-green
          500: '#6b8326',
          600: '#54661e',
          700: '#3f4d17',
          800: '#2a3c24', // cal-poly-green
          900: '#243010', // pakistan-green
          950: '#1a2408',
          hover: '#2a3c24', // cal-poly-green
        },
        
        // Updated Secondary Color Scale (Red Theme)
        secondary: {
          DEFAULT: '#cd5d67', // indian-red
          50: '#fceaec',
          100: '#f7d1d5',
          200: '#ebb9bf',
          300: '#de9ca5',
          400: '#cd5d67', // indian-red
          500: '#ba1f33', // red-ncs
          600: '#a01b2c',
          700: '#91171f', // carmine
          800: '#421820', // chocolate-cosmos-2
          900: '#410b13', // chocolate-cosmos
          950: '#2d0709',
          hover: '#91171f', // carmine
        },
        
        // Updated Status Colors to Match Theme
        success: {
          DEFAULT: '#87a330', // apple-green
          50: '#f0f4e4',
          100: '#dfe8c4',
          200: '#cad593',
          300: '#a1c349',
          400: '#87a330',
          500: '#6b8326',
          600: '#54661e',
          700: '#3f4d17',
          800: '#2a3c24',
          900: '#243010',
          950: '#1a2408',
          bg: 'rgba(135, 163, 48, 0.1)',
          border: '#a1c349',
        },
        
        warning: {
          DEFAULT: '#ffc107',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          bg: 'rgba(255, 193, 7, 0.1)',
          border: '#ffca2c',
        },
        
        error: {
          DEFAULT: '#ba1f33', // red-ncs
          50: '#fceaec',
          100: '#f7d1d5',
          200: '#ebb9bf',
          300: '#de9ca5',
          400: '#cd5d67',
          500: '#ba1f33',
          600: '#a01b2c',
          700: '#91171f',
          800: '#421820',
          900: '#410b13',
          950: '#2d0709',
          bg: 'rgba(186, 31, 51, 0.1)',
          border: '#cd5d67',
        },
        
        info: {
          DEFAULT: '#17a2b8',
          bg: 'rgba(23, 162, 184, 0.1)',
          border: '#20c997',
        },
        
        // Component Specific Colors
        sidebar: {
          bg: '#243010', // pakistan-green
          text: '#cad593', // sage
          hover: '#2a3c24', // cal-poly-green
          active: '#87a330', // apple-green
        },
        
        header: {
          bg: '#87a330', // apple-green
          text: '#ffffff',
          hover: '#a1c349', // yellow-green
        },
        
        // Verification Module Specific Colors
        campaign: {
          draft: '#cad593', // sage
          active: '#87a330', // apple-green
          paused: '#cd5d67', // indian-red
          completed: '#2a3c24', // cal-poly-green
          cancelled: '#91171f', // carmine
        },
        
        verification: {
          pending: '#cad593', // sage
          'in-progress': '#a1c349', // yellow-green
          verified: '#87a330', // apple-green
          approved: '#2a3c24', // cal-poly-green
          rejected: '#ba1f33', // red-ncs
        },
        
        discrepancy: {
          open: '#cd5d67', // indian-red
          'in-progress': '#a1c349', // yellow-green
          resolved: '#87a330', // apple-green
          closed: '#2a3c24', // cal-poly-green
        },
        
        priority: {
          low: '#cad593', // sage
          medium: '#a1c349', // yellow-green
          high: '#cd5d67', // indian-red
          critical: '#91171f', // carmine
        },
        
        condition: {
          excellent: '#87a330', // apple-green
          good: '#a1c349', // yellow-green
          fair: '#cad593', // sage
          poor: '#cd5d67', // indian-red
          damaged: '#ba1f33', // red-ncs
        },
        /* Legacy colors for backward compatibility */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        /* Material 3 Color System */
        'md-primary': "hsl(var(--md-sys-color-primary))",
        'md-on-primary': "hsl(var(--md-sys-color-on-primary))",
        'md-primary-container': "hsl(var(--md-sys-color-primary-container))",
        'md-on-primary-container': "hsl(var(--md-sys-color-on-primary-container))",
        'md-primary-fixed': "hsl(var(--md-sys-color-primary-fixed))",
        'md-on-primary-fixed': "hsl(var(--md-sys-color-on-primary-fixed))",
        'md-primary-fixed-dim': "hsl(var(--md-sys-color-primary-fixed-dim))",
        'md-on-primary-fixed-variant': "hsl(var(--md-sys-color-on-primary-fixed-variant))",
        
        'md-secondary': "hsl(var(--md-sys-color-secondary))",
        'md-on-secondary': "hsl(var(--md-sys-color-on-secondary))",
        'md-secondary-container': "hsl(var(--md-sys-color-secondary-container))",
        'md-on-secondary-container': "hsl(var(--md-sys-color-on-secondary-container))",
        
        'md-tertiary': "hsl(var(--md-sys-color-tertiary))",
        'md-on-tertiary': "hsl(var(--md-sys-color-on-tertiary))",
        'md-tertiary-container': "hsl(var(--md-sys-color-tertiary-container))",
        'md-on-tertiary-container': "hsl(var(--md-sys-color-on-tertiary-container))",
        
        'md-error': "hsl(var(--md-sys-color-error))",
        'md-on-error': "hsl(var(--md-sys-color-on-error))",
        'md-error-container': "hsl(var(--md-sys-color-error-container))",
        'md-on-error-container': "hsl(var(--md-sys-color-on-error-container))",
        
        'md-surface-dim': "hsl(var(--md-sys-color-surface-dim))",
        'md-surface': "hsl(var(--md-sys-color-surface))",
        'md-surface-bright': "hsl(var(--md-sys-color-surface-bright))",
        'md-on-surface': "hsl(var(--md-sys-color-on-surface))",
        'md-surface-variant': "hsl(var(--md-sys-color-surface-variant))",
        'md-on-surface-variant': "hsl(var(--md-sys-color-on-surface-variant))",
        'md-surface-container-lowest': "hsl(var(--md-sys-color-surface-container-lowest))",
        'md-surface-container-low': "hsl(var(--md-sys-color-surface-container-low))",
        'md-surface-container': "hsl(var(--md-sys-color-surface-container))",
        'md-surface-container-high': "hsl(var(--md-sys-color-surface-container-high))",
        'md-surface-container-highest': "hsl(var(--md-sys-color-surface-container-highest))",
        
        'md-outline': "hsl(var(--md-sys-color-outline))",
        'md-outline-variant': "hsl(var(--md-sys-color-outline-variant))",
        
        'md-inverse-surface': "hsl(var(--md-sys-color-inverse-surface))",
        'md-inverse-on-surface': "hsl(var(--md-sys-color-inverse-on-surface))",
        'md-inverse-primary': "hsl(var(--md-sys-color-inverse-primary))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        'none': '0',
        'xs': '4px',
        'sm': '8px', 
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '28px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
