import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sapphire: {
          950: "#0a1628",
          900: "#0f2240",
          850: "#122a50",
          800: "#163060",
          700: "#1e4080",
          600: "#2a5498",
          500: "#3670c6",
          400: "#5a92db",
          300: "#89b4e8",
          200: "#b8d4f0",
          100: "#dce8f5",
          50: "#eef4fa",
        },
        accent: {
          red: {
            600: "#dc2626",
            500: "#ef4444",
            400: "#f87171",
            300: "#fca5a5",
          },
          amber: {
            500: "#f59e0b",
            400: "#fbbf24",
          },
          emerald: {
            500: "#10b981",
            400: "#34d399",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "pearl-gradient":
          "linear-gradient(135deg, rgba(54, 112, 198, 0.08) 0%, rgba(15, 34, 64, 0.4) 50%, rgba(30, 64, 128, 0.12) 100%)",
        "pearl-radial":
          "radial-gradient(ellipse at 30% 20%, rgba(54, 112, 198, 0.15) 0%, transparent 50%)",
        "sapphire-sheen":
          "linear-gradient(160deg, rgba(90, 146, 219, 0.06) 0%, transparent 40%, rgba(54, 112, 198, 0.04) 100%)",
        "card-glow":
          "linear-gradient(135deg, rgba(54, 112, 198, 0.12) 0%, rgba(15, 34, 64, 0.6) 100%)",
        "red-glow":
          "radial-gradient(circle at center, rgba(248, 113, 113, 0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "sapphire-sm": "0 1px 3px rgba(10, 22, 40, 0.4), 0 0 0 1px rgba(54, 112, 198, 0.06)",
        "sapphire-md": "0 4px 16px rgba(10, 22, 40, 0.5), 0 0 0 1px rgba(54, 112, 198, 0.08)",
        "sapphire-lg": "0 8px 32px rgba(10, 22, 40, 0.6), 0 0 0 1px rgba(54, 112, 198, 0.1)",
        "glow-red": "0 0 20px rgba(248, 113, 113, 0.25), 0 0 60px rgba(248, 113, 113, 0.08)",
        "glow-sapphire": "0 0 20px rgba(54, 112, 198, 0.2), 0 0 60px rgba(54, 112, 198, 0.06)",
        "inner-shine": "inset 0 1px 0 rgba(184, 212, 240, 0.05)",
      },
      borderColor: {
        "glass-edge": "rgba(54, 112, 198, 0.15)",
        "glass-edge-hover": "rgba(90, 146, 219, 0.25)",
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-fade-in": "slide-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "gauge-fill": "gauge-fill 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "count-up": "count-up 0.8s ease-out both",
        "pearl-shimmer": "pearl-shimmer 8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "progress-shimmer": "progress-shimmer 1.5s ease-in-out infinite",
        "slide-up-sheet": "slide-up-sheet 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-down-sheet": "slide-down-sheet 0.2s ease-in both",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gauge-fill": {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--gauge-target)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pearl-shimmer": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "progress-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        "slide-up-sheet": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-down-sheet": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
