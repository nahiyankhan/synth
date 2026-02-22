/**
 * Token Name Utilities
 *
 * Shared utilities for formatting and shortening design token names
 * across color visualization components.
 */

/**
 * Common prefixes to strip from token names for cleaner display.
 * Order matters - more specific patterns should come first.
 */
const TOKEN_PREFIXES = [
  /^semantic\.color\./i,
  /^colors?\./i,
  /^palette\./i,
];

/**
 * Shorten a token name for display by removing common prefixes
 * and keeping only the last N segments.
 *
 * @param name - Full token name (e.g., "semantic.color.text.primary")
 * @param segments - Number of segments to keep from the end (default: 2)
 * @returns Shortened name (e.g., "text.primary")
 *
 * @example
 * shortenTokenName("semantic.color.text.primary") // "text.primary"
 * shortenTokenName("color.gray.500") // "gray.500"
 * shortenTokenName("primary", 1) // "primary"
 */
export function shortenTokenName(name: string, segments: number = 2): string {
  let result = name;

  // Remove common prefixes
  for (const prefix of TOKEN_PREFIXES) {
    result = result.replace(prefix, "");
  }

  // Split and take last N segments
  const parts = result.split(".");
  return parts.slice(-segments).join(".");
}

/**
 * Get the last segment of a token name.
 * Useful for very compact displays.
 *
 * @param name - Token name
 * @returns Last segment only
 *
 * @example
 * getTokenLastSegment("semantic.color.text.primary") // "primary"
 * getTokenLastSegment("gray.500") // "500"
 */
export function getTokenLastSegment(name: string): string {
  return name.split(".").pop() || name;
}
