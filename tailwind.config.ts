import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0c11",
        panel: "#111520",
        panel2: "#161b28",
        line: "#232a3b",
        line2: "#2e3750",
        ink: "#e8ebf3",
        muted: "#8b93a7",
        faint: "#5c6479",
        brand: {
          DEFAULT: "#6d6bff",
          soft: "#8b8aff",
          dim: "#3d3d7a",
        },
        teal: "#33d6c4",
        amber: "#f5b53d",
        rose: "#ff6b81",
        green: "#37d399",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 30px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(109,107,255,0.4), 0 8px 30px rgba(109,107,255,0.15)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [],
};

export default config;
