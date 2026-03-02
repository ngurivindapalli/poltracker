import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F', // Deep Blue
          hover: '#152C4E',
        },
        secondary: {
          DEFAULT: '#64748B', // Slate Gray
        },
        accent: {
          DEFAULT: '#2563EB', // Blue 600
          hover: '#1D4ED8',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        background: {
          DEFAULT: '#F8FAFC',
        },
        card: {
          DEFAULT: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: []
} satisfies Config
