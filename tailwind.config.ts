import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // Product-specific palette: "Huerta" (fresh, appetizing, native iOS feel)
        basil: {
          50: "#EEF7F1",
          100: "#D6EDDF",
          400: "#4E9C74",
          500: "#2E7D5B",
          600: "#236449",
        },
        citrus: {
          100: "#FFE9D6",
          400: "#FF9F5A",
          500: "#FF8A3D",
          600: "#E56F22",
        },
        berry: {
          500: "#C85C7A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-t": "env(safe-area-inset-top)",
      },
      keyframes: {
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
