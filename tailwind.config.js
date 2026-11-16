/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ember — dark-only warm graphite with a single accent
        canvas: '#0b0b0a',
        surface: {
          0: '#0d0d0c',
          1: '#111110',
          2: '#171715',
          3: '#1e1e1b',
          4: '#272723',
          5: '#32322d',
        },
        border: {
          subtle: 'rgba(233, 228, 216, 0.07)',
          DEFAULT: 'rgba(233, 228, 216, 0.12)',
          hover: 'rgba(233, 228, 216, 0.26)',
          active: 'rgba(233, 228, 216, 0.42)',
        },
        // Ember: the only accent. Reserved for progress, focus and the primary action.
        accent: {
          DEFAULT: '#ff5b2e',
          hover: '#ff7048',
          active: '#e64a1e',
          muted: 'rgba(255, 91, 46, 0.12)',
          subtle: 'rgba(255, 91, 46, 0.06)',
          border: 'rgba(255, 91, 46, 0.30)',
          text: '#0b0b0a',
        },
        success: {
          DEFAULT: '#4cc38a',
          muted: 'rgba(76, 195, 138, 0.10)',
          border: 'rgba(76, 195, 138, 0.25)',
        },
        warning: {
          DEFAULT: '#e0a43a',
          muted: 'rgba(224, 164, 58, 0.10)',
          border: 'rgba(224, 164, 58, 0.25)',
        },
        danger: {
          DEFAULT: '#f0647e',
          muted: 'rgba(240, 100, 126, 0.10)',
          border: 'rgba(240, 100, 126, 0.25)',
        },
        // Kept for compatibility; neutral so no blue enters the palette.
        info: {
          DEFAULT: '#9b978c',
          muted: 'rgba(155, 151, 140, 0.10)',
          border: 'rgba(155, 151, 140, 0.25)',
        },
        text: {
          primary: '#e9e4d8',
          secondary: '#c9c4b8',
          tertiary: '#9a9488',
          quaternary: '#6e6a61',
        },
      },
      fontFamily: {
        serif: ['Newsreader', '"Iowan Old Style"', 'Georgia', 'serif'],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      fontSize: {
        'xxs': ['0.6875rem', { lineHeight: '0.95rem' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        elevated: '0 8px 30px rgba(0, 0, 0, 0.55)',
        card: '0 1px 3px rgba(0, 0, 0, 0.25)',
        glow: '0 0 24px rgba(255, 91, 46, 0.22)',
        lift: '0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 32px -12px rgba(0, 0, 0, 0.8)',
        subtle: '0 1px 2px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
