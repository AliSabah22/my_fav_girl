import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#1c1620",
        "bg-soft": "#251c2c",
        panel: "#2a2032",
        line: "#3a2e44",
        cream: "#f3ead9",
        gold: "#c9a15a",
        rose: "#d98a82",
        muted: "#9a8aa3",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
