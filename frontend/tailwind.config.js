/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../apps/*/frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:     'hsl(var(--background))',
        foreground:     'hsl(var(--foreground))',
        card:           { DEFAULT: 'hsl(var(--card))',            foreground: 'hsl(var(--card-foreground))' },
        popover:        { DEFAULT: 'hsl(var(--popover))',         foreground: 'hsl(var(--popover-foreground))' },
        primary:        { DEFAULT: 'hsl(var(--primary))',         foreground: 'hsl(var(--primary-foreground))' },
        secondary:      { DEFAULT: 'hsl(var(--secondary))',       foreground: 'hsl(var(--secondary-foreground))' },
        muted:          { DEFAULT: 'hsl(var(--muted))',           foreground: 'hsl(var(--muted-foreground))' },
        accent:         { DEFAULT: 'hsl(var(--accent))',          foreground: 'hsl(var(--accent-foreground))' },
        destructive:    { DEFAULT: 'hsl(var(--destructive))',     foreground: 'hsl(var(--destructive-foreground))' },
        border:         'hsl(var(--border))',
        input:          'hsl(var(--input))',
        ring:           'hsl(var(--ring))',
        // ATS score colours
        'score-high':   'hsl(var(--score-high))',
        'score-good':   'hsl(var(--score-good))',
        'score-mid':    'hsl(var(--score-mid))',
        'score-low':    'hsl(var(--score-low))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'shimmer':      'shimmer 2.5s linear infinite',
        'glow-pulse':   'glow-pulse 3s ease-in-out infinite',
        'fade-in':      'fade-in 0.4s ease-out both',
        'slide-up':     'slide-up 0.4s ease-out both',
        'border-beam':  'border-beam 4s linear infinite',
        'beam':         'beam 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', filter: 'blur(8px)' },
          '50%':      { opacity: '1',   filter: 'blur(12px)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'border-beam': {
          '0%':   { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        beam: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
    },
  },
  plugins: [],
};
