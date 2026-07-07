import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        zurich: ["Oswald", "sans-serif"],
        "zurich-cond": ["Barlow Condensed", "sans-serif"],
      },
      colors: {
        bg: "#0a0a0f",
        "bg-panel": "rgba(20, 20, 30, 0.85)",
        amber: "#f59e0b",
        "amber-glow": "rgba(245, 158, 11, 0.3)",
        warm: "#ff9f43",
      },
    },
  },
  plugins: [],
};

export default config;
