import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Slate Blue + Warm Gray palette
        primary: {
          DEFAULT: '#1E293B', // Slate 800 - Primary text/headings
        },
        accent: {
          DEFAULT: '#2563EB', // Blue 600 - Links, buttons, active states
        },
        muted: {
          DEFAULT: '#64748B', // Slate 500 - Muted text
        },
        border: {
          DEFAULT: '#E5E7EB', // Gray 200 - Borders/dividers
        },
        background: {
          DEFAULT: '#F8FAFC', // Slate 50 - Page background
        },
      },
    },
  },
  plugins: []
} satisfies Config
