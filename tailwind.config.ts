import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        cardForeground: "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        primaryForeground: "hsl(var(--primary-foreground))",
        muted: "hsl(var(--muted))",
        mutedForeground: "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        destructive: "hsl(var(--destructive))",
        destructiveForeground: "hsl(var(--destructive-foreground))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        party: {
          d: "hsl(var(--party-d))",
          r: "hsl(var(--party-r))",
          i: "hsl(var(--party-i))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        elevated: "var(--shadow-elevated)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms var(--ease-out) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
