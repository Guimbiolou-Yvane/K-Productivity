// Shared design tokens for Karisma Neo-Brutalist style
export const COLORS = {
  yellow: "#FFDA59",
  yellowBright: "#FFFF00",
  black: "#000000",
  darkBg: "#0a0a0a",
  darkSurface: "#141414",
  darkCard: "#1C1C1C",
  white: "#FFFFFF",
  green: "#1fb05a",
  red: "#ff6b6b",
  blue: "#4facff",
  purple: "#9d4edd",
  orange: "#ff9e00",
  cyan: "#00d4ff",
} as const;

export const FONT = "'Montserrat', sans-serif";

export const NEO_SHADOW = "6px 6px 0px 0px rgba(255,218,89,1)";
export const NEO_SHADOW_WHITE = "6px 6px 0px 0px rgba(255,255,255,1)";
export const NEO_BORDER = `3px solid ${COLORS.yellow}`;
export const NEO_BORDER_WHITE = `3px solid ${COLORS.white}`;
