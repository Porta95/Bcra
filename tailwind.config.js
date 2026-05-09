/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        panel: "#111111",
        panel2: "#161616",
        border: "#262626",
        borderStrong: "#3a3a3a",
        muted: "#8a8a8a",
        mutedSoft: "#5a5a5a",
        ink: "#ededed",
        accent: "#f5c518",
        accentDim: "#a88a10",
        ok: "#4ade80",
        warn: "#f59e0b",
        danger: "#ef4444",
        info: "#60a5fa",
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
