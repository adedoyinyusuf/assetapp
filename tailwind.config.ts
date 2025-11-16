import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Base semantic colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Primary AssetHub green theme - Enhanced
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(152, 81%, 96%)",
          100: "hsl(154, 76%, 89%)",
          200: "hsl(156, 72%, 79%)",
          300: "hsl(158, 64%, 64%)",
          400: "hsl(160, 51%, 49%)",
          500: "hsl(163, 72%, 41%)",
          600: "hsl(163, 72%, 34%)",
          700: "hsl(163, 72%, 27%)",
          800: "hsl(163, 72%, 23%)",
          900: "hsl(165, 72%, 16%)",
          950: "hsl(166, 84%, 9%)",
        },
        
        // Secondary neutral colors - Enhanced
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "hsl(210, 40%, 98%)",
          100: "hsl(210, 40%, 96%)",
          200: "hsl(214, 32%, 91%)",
          300: "hsl(213, 27%, 84%)",
          400: "hsl(215, 20%, 65%)",
          500: "hsl(215, 16%, 47%)",
          600: "hsl(215, 19%, 35%)",
          700: "hsl(215, 25%, 27%)",
          800: "hsl(217, 33%, 17%)",
          900: "hsl(222, 47%, 11%)",
          950: "hsl(222, 84%, 5%)",
        },
        
        // Accent colors for highlights and interactive elements
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "hsl(204, 100%, 97%)",
          100: "hsl(204, 94%, 94%)",
          200: "hsl(201, 94%, 86%)",
          300: "hsl(199, 95%, 74%)",
          400: "hsl(198, 93%, 60%)",
          500: "hsl(199, 89%, 48%)",
          600: "hsl(200, 98%, 39%)",
          700: "hsl(201, 96%, 32%)",
          800: "hsl(201, 90%, 27%)",
          900: "hsl(202, 80%, 24%)",
          950: "hsl(202, 80%, 16%)",
        },
        
        // Semantic status colors
        success: {
          DEFAULT: "hsl(var(--success, 142 76% 36%))",
          foreground: "hsl(var(--success-foreground, 355 78% 95%))",
          50: "hsl(138, 76%, 97%)",
          100: "hsl(141, 84%, 93%)",
          200: "hsl(141, 79%, 85%)",
          300: "hsl(142, 77%, 73%)",
          400: "hsl(142, 69%, 58%)",
          500: "hsl(142, 76%, 36%)",
          600: "hsl(142, 72%, 29%)",
          700: "hsl(142, 64%, 24%)",
          800: "hsl(142, 53%, 20%)",
          900: "hsl(143, 61%, 16%)",
        },
        
        warning: {
          DEFAULT: "hsl(var(--warning, 38 92% 50%))",
          foreground: "hsl(var(--warning-foreground, 48 96% 89%))",
          50: "hsl(48, 100%, 96%)",
          100: "hsl(48, 96%, 89%)",
          200: "hsl(48, 97%, 77%)",
          300: "hsl(46, 97%, 65%)",
          400: "hsl(43, 96%, 56%)",
          500: "hsl(38, 92%, 50%)",
          600: "hsl(32, 95%, 44%)",
          700: "hsl(26, 90%, 37%)",
          800: "hsl(23, 83%, 31%)",
          900: "hsl(22, 78%, 26%)",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          50: "hsl(0, 86%, 97%)",
          100: "hsl(0, 93%, 94%)",
          200: "hsl(0, 96%, 89%)",
          300: "hsl(0, 94%, 82%)",
          400: "hsl(0, 91%, 71%)",
          500: "hsl(0, 84%, 60%)",
          600: "hsl(0, 72%, 51%)",
          700: "hsl(0, 74%, 42%)",
          800: "hsl(0, 70%, 35%)",
          900: "hsl(0, 63%, 31%)",
        },
        
        // UI element colors
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        // Form and interaction colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Chart colors for dashboards
        chart: {
          1: "hsl(var(--chart-1, 163 72% 41%))",
          2: "hsl(var(--chart-2, 199 89% 48%))",
          3: "hsl(var(--chart-3, 142 76% 36%))",
          4: "hsl(var(--chart-4, 38 92% 50%))",
          5: "hsl(var(--chart-5, 0 84% 60%))",
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      // Enhanced border radius system
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
        xl: "calc(var(--radius, 0.75rem) + 4px)",
        '2xl': "calc(var(--radius, 0.75rem) + 8px)",
      },
      
      // Enhanced shadow system
      boxShadow: {
        'elevation-1': 'var(--elevation-1)',
        'elevation-2': 'var(--elevation-2)',
        'elevation-3': 'var(--elevation-3)',
        'elevation-4': 'var(--elevation-4)',
        'glow': '0 0 20px -12px hsl(var(--primary))',
        'glow-lg': '0 0 30px -12px hsl(var(--primary))',
      },
      
      // Animation and transitions
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0px)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
