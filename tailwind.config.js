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
      keyframes: {
        pulseBar: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "pulse-bar": "pulseBar 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
