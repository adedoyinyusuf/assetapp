/** 
 * Mobile & Touch Optimization Utilities
 * Provides classes for better mobile UX
 */

export const mobileOptimized = {
    // Touch-friendly tap targets (minimum 44x44px)
    touchTarget: "min-h-[44px] min-w-[44px]",

    // Larger touch areas for buttons
    touchButton: "px-6 py-3 min-h-[48px]",

    // Prevent text selection on interactive elements
    noSelect: "select-none",

    // Safe area padding for notched devices
    safeArea: {
        top: "pt-safe",
        bottom: "pb-safe",
        left: "pl-safe",
        right: "pr-safe",
    },

    // Mobile-optimized spacing
    spacing: {
        container: "px-4 sm:px-6 lg:px-8",
        section: "py-6 sm:py-8 lg:py-10",
    },

    // Responsive text sizes
    text: {
        hero: "text-3xl sm:text-4xl lg:text-5xl",
        heading: "text-2xl sm:text-3xl lg:text-4xl",
        subheading: "text-xl sm:text-2xl lg:text-3xl",
        body: "text-base sm:text-lg",
    },

    // Mobile-friendly card padding
    card: "p-4 sm:p-6",

    // Smooth scrollable container with momentum
    scrollable: "overflow-auto scroll-smooth -webkit-overflow-scrolling-touch",

    // Stack on mobile, grid on desktop
    responsiveGrid: {
        two: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6",
        three: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
        four: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
    },
};

/**
 * Animation Utilities
 * Subtle, accessible animations
 */
export const animations = {
    // Fade in animation
    fadeIn: "animate-in fade-in duration-300",

    // Slide in from bottom
    slideUp: "animate-in slide-in-from-bottom-4 duration-300",

    // Scale in
    scaleIn: "animate-in zoom-in-95 duration-200",

    // Smooth transitions
    transition: "transition-all duration-200 ease-in-out",

    // Hover effects
    hoverLift: "transition-transform hover:-translate-y-1 duration-200",
    hoverGrow: "transition-transform hover:scale-105 duration-200",

    // Loading pulse
    pulse: "animate-pulse",

    // Spin animation
    spin: "animate-spin",

    // Bounce effect
    bounce: "animate-bounce",
};

/**
 * Accessibility Utilities
 */
export const a11y = {
    // Screen reader only
    srOnly: "sr-only",

    // Focus visible ring
    focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

    // Skip to content link
    skipLink: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md",

    // Reduced motion preference
    reduceMotion: "motion-reduce:transition-none motion-reduce:animate-none",
};

/**
 * Performance Utilities
 */
export const performance = {
    // GPU-accelerated transforms
    gpuAccelerated: "transform-gpu",

    // Contain layout shifts
    containLayout: "contain-layout",

    // Optimize rendering
    willChange: "will-change-transform",

    // Lazy load images
    lazyLoad: "loading-lazy",
};

/**
 * Combined utility generator
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Mobile-first responsive utilities
 */
export const responsive = {
    // Hide on mobile, show on desktop
    desktopOnly: "hidden md:block",

    // Show on mobile, hide on desktop
    mobileOnly: "block md:hidden",

    // Tablet and up
    tabletUp: "hidden sm:block",

    // Mobile and tablet
    mobileTablet: "block lg:hidden",
};

/**
 * Touch gesture utilities
 */
export const touch = {
    // Prevent bounce/scroll on iOS
    preventBounce: "overscroll-none",

    // Smooth scrolling
    smoothScroll: "scroll-smooth",

    // Snap scrolling
    snapMandatory: "snap-mandatory snap-x",
    snapStart: "snap-start",
    snapCenter: "snap-center",

    // Touch action
    touchNone: "touch-none",
    touchPanY: "touch-pan-y",
    touchPanX: "touch-pan-x",
};
