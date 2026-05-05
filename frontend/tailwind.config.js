/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors - WCAG AA compliant
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Secondary colors
        secondary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Status colors - WCAG AA compliant
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
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
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Game-specific colors
        crash: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        multiplier: {
          low: '#10b981',    // Green for low multipliers (1.00x - 2.00x)
          medium: '#f59e0b', // Orange for medium multipliers (2.00x - 10.00x)
          high: '#ef4444',   // Red for high multipliers (10.00x+)
        },
        // Theme-specific colors for better dark mode support
        theme: {
          light: {
            bg: '#ffffff',
            'bg-secondary': '#f8fafc',
            'bg-tertiary': '#f1f5f9',
            text: '#0f172a',
            'text-secondary': '#475569',
            'text-muted': '#64748b',
            border: '#e2e8f0',
            'border-light': '#f1f5f9',
          },
          dark: {
            bg: '#0f172a',
            'bg-secondary': '#1e293b',
            'bg-tertiary': '#334155',
            text: '#f8fafc',
            'text-secondary': '#cbd5e1',
            'text-muted': '#94a3b8',
            border: '#334155',
            'border-light': '#475569',
          },
        },
      },
      fontSize: {
        multiplier: ['4rem', { lineHeight: '1' }],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        crash: 'crash 1s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-up': 'slideInUp 0.3s ease-in-out',
        'slide-in-down': 'slideInDown 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'crash-pulse': 'crashPulse 2s ease-in-out infinite',
        'flash': 'flash 0.3s ease-in-out',
        'fade-in-delay': 'fadeInDelay 2s ease-in-out',
        'multiplier-glow': 'multiplierGlow 2s ease-in-out infinite',
        'cash-out-pulse': 'cashOutPulse 1s ease-in-out infinite',
        'rocket-wobble': 'rocketWobble 0.3s ease-in-out infinite',
        'explosion-particle': 'explosionParticle 1s ease-out forwards',
      },
      keyframes: {
        crash: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '70%': { transform: 'scale(0.9)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        crashPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        flash: {
          '0%': { opacity: '0' },
          '10%': { opacity: '0.8' },
          '20%': { opacity: '0' },
          '100%': { opacity: '0' },
        },
        fadeInDelay: {
          '0%': { opacity: '0' },
          '70%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        multiplierGlow: {
          '0%, 100%': { boxShadow: '0 0 5px theme("colors.primary.500")' },
          '50%': { boxShadow: '0 0 20px theme("colors.primary.400"), 0 0 30px theme("colors.primary.300")' },
        },
        cashOutPulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 theme("colors.success.500")' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 0 10px transparent' },
        },
        rocketWobble: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        explosionParticle: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--particle-distance, 50px), 0) scale(0)', opacity: '0' },
        },
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
