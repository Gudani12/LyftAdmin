/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { deep: '#1d1135', dark: '#5A189A', accent: '#9D4EDD' },
        ui: { surface: '#FFFFFF', ink: '#21152F', muted: '#746A7E', faint: '#A69BAF', border: '#E9E2F0' },
        deep: { DEFAULT: '#1d1135', 800: '#1d1135', 700: '#2C1749', 600: '#3A2162' },
        ink: '#21152F',
        paper: '#F7F3FA',
        accent: { DEFAULT: '#9D4EDD', 50: '#F3E9FF', 100: '#E9D7FF', 600: '#5A189A', 700: '#3F1B69' },
        good: { DEFAULT: '#9D4EDD', bg: '#F3E9FF' },
        info: { DEFAULT: '#5A189A', bg: '#F3E9FF' },
        mint: '#D9B9FF',
        tint: '#F3E9FF',
        bad: { DEFAULT: '#E04545', bg: '#FDE9E9' },
        slate2: { DEFAULT: '#746A7E', bg: '#F3E9FF' },
        amber: { DEFAULT: '#BA8CFF', bg: '#F3E9FF' },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(216,53,58,0.45)' },
          '70%': { boxShadow: '0 0 0 8px rgba(190,48,53,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(216,53,58,0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        softGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(14,92,63,0.15), 0 0 0 rgba(14,92,63,0.08)' },
          '50%': { boxShadow: '0 0 18px rgba(14,92,63,0.15), 0 0 32px rgba(111,239,180,0.12)' },
        },
      },
      animation: {
        'pulse-ring': 'pulseRing 1.6s infinite',
        'fade-in-up': 'fadeInUp 0.45s ease-out both',
        'soft-glow': 'softGlow 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
