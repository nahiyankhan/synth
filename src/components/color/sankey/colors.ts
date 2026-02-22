/**
 * Sankey Canvas Theme Colors
 *
 * Color definitions for light and dark modes.
 * Based on cash-design-system patterns.
 */

export const colors = {
  light: {
    bg: "#ffffff",
    border: "#e8e8e8",
    borderStandard: "#959595",
    borderProminent: "#101010",
    borderHover: "#101010",
    borderActive: "#101010",
    text: "#101010",
    textMuted: "#1e1e1e",
    linkDefault: "#cbd5e1",
    linkActive: "#3b82f6",
  },
  dark: {
    bg: "#1a1a1a",
    border: "#232323",
    borderStandard: "#595959",
    borderProminent: "#ffffff",
    borderHover: "#ffffff",
    borderActive: "#ffffff",
    text: "#ffffff",
    textMuted: "#e1e1e1",
    linkDefault: "#475569",
    linkActive: "#60a5fa",
  },
} as const;

export type ThemeColors = (typeof colors)["light"] | (typeof colors)["dark"];
