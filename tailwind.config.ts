import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0f172a",
          sky: "#0ea5e9",
          mint: "#14b8a6",
          warn: "#f59e0b",
          danger: "#dc2626",
          panel: "#f8fafc"
        }
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
