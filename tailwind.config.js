/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panel2: "rgb(var(--panel2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        borderStrong: "rgb(var(--border-strong) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        mutedSoft: "rgb(var(--muted-soft) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentDim: "rgb(var(--accent-dim) / <alpha-value>)",
        ok: "rgb(var(--ok) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', "ui-monospace", "monospace"],
        display: ['"IBM Plex Serif"', "Georgia", "serif"],
      },
      fontFeatureSettings: {
        tabular: '"tnum"',
      },
      // Modular type scale (12 14 16 18 24 32 48 64 96)
      fontSize: {
        "2xs": ["10px", { lineHeight: "1.4" }],
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.6" }],
        base: ["16px", { lineHeight: "1.6" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["24px", { lineHeight: "1.3" }],
        "2xl": ["32px", { lineHeight: "1.2" }],
        "3xl": ["48px", { lineHeight: "1.1" }],
        "4xl": ["64px", { lineHeight: "1.05" }],
        "5xl": ["96px", { lineHeight: "1" }],
        // Hero clamp para títulos de impacto
        "hero": ["clamp(2.5rem, 8vw, 5.5rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display": ["clamp(2rem, 5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
      },
      keyframes: {
        pulseBar: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-bar": "pulseBar 1.4s ease-in-out infinite",
        "fade-up": "fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) backwards",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
