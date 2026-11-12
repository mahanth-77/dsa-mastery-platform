/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#08090a',
        surface: {
          0: '#0d0f12',
          1: '#121519',
          2: '#181c22',
          3: '#20252d',
          4: '#282f3a',
          5: '#323a47',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.16)',
          active: 'rgba(255, 255, 255, 0.28)',
        },
        // Refined Linear-style electric indigo developer accent
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          active: '#4338ca',
          muted: 'rgba(99, 102, 241, 0.12)',
          subtle: 'rgba(99, 102, 241, 0.06)',
          border: 'rgba(99, 102, 241, 0.28)',
          text: '#ffffff',
        },
        success: {
          DEFAULT: '#10b981',
          muted: 'rgba(16, 185, 129, 0.10)',
          border: 'rgba(16, 185, 129, 0.25)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: 'rgba(245, 158, 11, 0.10)',
          border: 'rgba(245, 158, 11, 0.25)',
        },
        danger: {
          DEFAULT: '#ef4444',
          muted: 'rgba(239, 68, 68, 0.10)',
          border: 'rgba(239, 68, 68, 0.25)',
        },
        info: {
          DEFAULT: '#3b82f6',
          muted: 'rgba(59, 130, 246, 0.10)',
          border: 'rgba(59, 130, 246, 0.25)',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          quaternary: '#475569',
        },
      },
      fontFamily: {
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
        glow: '0 0 20px rgba(99, 102, 241, 0.15)',
        subtle: '0 1px 2px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
