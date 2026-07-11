import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light theme — high contrast, foarte lizibil
        bg: "#f4f6fb",       // fundal aplicație
        panel: "#ffffff",    // carduri
        panel2: "#eef1f8",   // zone insetate
        line: "#dde2ee",     // borduri
        line2: "#c7cee0",
        ink: "#111726",      // text principal (aproape negru, contrast puternic)
        muted: "#414a5e",    // text secundar — suficient de închis ca să se citească clar
        faint: "#5a6377",    // text terțiar — tot lizibil, nu șters
        brand: {
          DEFAULT: "#5b57f0",
          soft: "#4d49e0",   // pentru text/accente pe alb (mai închis = contrast)
          dim: "#c9c8ff",
        },
        teal: "#0d9488",
        amber: "#b45309",
        rose: "#e11d48",
        green: "#15935f",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,23,38,0.04), 0 6px 20px rgba(17,23,38,0.06)",
        glow: "0 6px 20px rgba(91,87,240,0.25)",
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
