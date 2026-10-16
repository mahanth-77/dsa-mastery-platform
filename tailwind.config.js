/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#090a0b',
        surface: {
          0: '#0c0d0f',
          1: '#121417',
          2: '#171a1e',
          3: '#1e2227',
          4: '#262b32',
          5: '#30373f',
        },
        border: {
          subtle: '#1b1e23',
          DEFAULT: '#242830',
          hover: '#343a46',
          active: '#48505e',
        },
        // Acid-lime developer accent
        accent: {
          DEFAULT: '#c8f560',
          hover: '#d4f978',
          active: '#b8e650',
          muted: 'rgba(200, 245, 96, 0.08)',
          subtle: 'rgba(200, 245, 96, 0.04)',
          border: 'rgba(200, 245, 96, 0.22)',
          text: '#0c0d0f',
        },
        success: {
          DEFAULT: '#34d399',
          muted: 'rgba(52, 211, 153, 0.10)',
          border: 'rgba(52, 211, 153, 0.25)',
        },
        warning: {
          DEFAULT: '#fbbf24',
          muted: 'rgba(251, 191, 36, 0.10)',
          border: 'rgba(251, 191, 36, 0.25)',
        },
        danger: {
          DEFAULT: '#f87171',
          muted: 'rgba(248, 113, 113, 0.10)',
          border: 'rgba(248, 113, 113, 0.25)',
        },
        info: {
          DEFAULT: '#38bdf8',
          muted: 'rgba(56, 189, 248, 0.10)',
          border: 'rgba(56, 189, 248, 0.25)',
        },
        text: {
          primary: '#f3f4f6',
          secondary: '#9ca3af',
          tertiary: '#6b7280',
          quaternary: '#4b5563',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
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
        elevated: '0 8px 30px rgba(0, 0, 0, 0.45)',
        card: '0 1px 3px rgba(0, 0, 0, 0.2)',
        glow: '0 0 20px rgba(200, 245, 96, 0.12)',
      },
    },
  },
  plugins: [],
};
