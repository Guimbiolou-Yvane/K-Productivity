import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        background: "var(--background)",
        surface: "var(--surface)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
      },
      boxShadow: {
        neo: "4px 4px 0px 0px var(--shadow-color)",
        "neo-sm": "2px 2px 0px 0px var(--shadow-color)",
      },
      borderWidth: {
        "3": "3px",
      },
      fontFamily: {
        sans: ["var(--font-archivo-black)", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
