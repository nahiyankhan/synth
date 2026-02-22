/**
 * Color Science Service
 * 
 * Comprehensive color analysis and conversion utilities using OKLCH color space.
 * Provides perceptual color operations, accessibility calculations, and harmony detection.
 */

import {
  formatHex,
  formatRgb,
  formatHsl,
  oklch,
  rgb,
  differenceEuclidean,
  wcagContrast,
  Oklch,
  Rgb,
} from 'culori';

// ============================================================================
// Type Definitions
// ============================================================================

export interface OKLCHColor {
  l: number; // Lightness: 0-1 (0 = black, 1 = white)
  c: number; // Chroma: 0-0.4+ (0 = gray, higher = more saturated)
  h: number; // Hue: 0-360 (degrees)
}

export interface ColorConversions {
  hex: string;
  rgb: string;
  hsl: string;
  oklch: OKLCHColor;
}

export interface ColorDistance {
  nodeId: string;
  distance: number;
  color: string;
}

export interface ColorHarmony {
  type: 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split-complementary';
  colors: OKLCHColor[];
}

export interface ContrastResult {
  ratio: number;
  wcagLevel: 'AAA' | 'AA' | 'A' | 'fail';
  largeTextAAA: boolean;
  largeTextAA: boolean;
  normalTextAAA: boolean;
  normalTextAA: boolean;
}

export interface ColorCluster {
  id: string;
  name: string;
  colors: string[]; // node IDs
  centroid: OKLCHColor;
  avgLightness: number;
  avgChroma: number;
  avgHue: number;
}

// ============================================================================
// Color Conversion
// ============================================================================

/**
 * Convert hex color to OKLCH
 */
export function hexToOKLCH(hex: string): OKLCHColor {
  const color = oklch(hex);
  if (!color) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  
  return {
    l: color.l ?? 0,
    c: color.c ?? 0,
    h: color.h ?? 0,
  };
}

/**
 * Convert OKLCH to hex
 */
export function oklchToHex(color: OKLCHColor): string {
  const hex = formatHex({
    mode: 'oklch',
    l: color.l,
    c: color.c,
    h: color.h,
  });
  return hex;
}

/**
 * Get all format conversions for a hex color
 */
export function getColorConversions(hex: string): ColorConversions {
  const oklchColor = hexToOKLCH(hex);
  const rgbColor = rgb(hex);
  
  return {
    hex,
    rgb: formatRgb(rgbColor),
    hsl: formatHsl(hex),
    oklch: oklchColor,
  };
}

// ============================================================================
// Perceptual Distance Calculations
// ============================================================================

/**
 * Calculate perceptual distance between two colors in OKLCH space
 * Uses Euclidean distance in OKLCH cylindrical coordinates
 */
export function getPerceptualDistance(color1: OKLCHColor, color2: OKLCHColor): number {
  // Convert to Cartesian coordinates for accurate distance
  const a1 = color1.c * Math.cos((color1.h * Math.PI) / 180);
  const b1 = color1.c * Math.sin((color1.h * Math.PI) / 180);
  const a2 = color2.c * Math.cos((color2.h * Math.PI) / 180);
  const b2 = color2.c * Math.sin((color2.h * Math.PI) / 180);

  const dL = color1.l - color2.l;
  const da = a1 - a2;
  const db = b1 - b2;

  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Calculate perceptual distance using culori's differenceEuclidean
 */
export function getColorDistance(hex1: string, hex2: string): number {
  return differenceEuclidean('oklch')(hex1, hex2);
}

/**
 * Find nearest colors to a given color
 */
export function findNearestColors(
  targetColor: OKLCHColor,
  palette: Array<{ nodeId: string; color: OKLCHColor; hex: string }>,
  limit: number = 5
): ColorDistance[] {
  const distances = palette
    .map((item) => ({
      nodeId: item.nodeId,
      distance: getPerceptualDistance(targetColor, item.color),
      color: item.hex,
    }))
    .sort((a, b) => a.distance - b.distance);

  return distances.slice(0, limit);
}

// ============================================================================
// Color Harmony
// ============================================================================

/**
 * Generate complementary color (180° hue rotation)
 */
export function getComplementaryColor(color: OKLCHColor): OKLCHColor {
  return {
    ...color,
    h: (color.h + 180) % 360,
  };
}

/**
 * Generate analogous colors (±30° hue)
 */
export function getAnalogousColors(color: OKLCHColor): OKLCHColor[] {
  return [
    { ...color, h: (color.h - 30 + 360) % 360 },
    color,
    { ...color, h: (color.h + 30) % 360 },
  ];
}

/**
 * Generate triadic colors (120° spacing)
 */
export function getTriadicColors(color: OKLCHColor): OKLCHColor[] {
  return [
    color,
    { ...color, h: (color.h + 120) % 360 },
    { ...color, h: (color.h + 240) % 360 },
  ];
}

/**
 * Generate tetradic (square) colors (90° spacing)
 */
export function getTetradicColors(color: OKLCHColor): OKLCHColor[] {
  return [
    color,
    { ...color, h: (color.h + 90) % 360 },
    { ...color, h: (color.h + 180) % 360 },
    { ...color, h: (color.h + 270) % 360 },
  ];
}

/**
 * Generate split-complementary colors
 */
export function getSplitComplementaryColors(color: OKLCHColor): OKLCHColor[] {
  const complementary = (color.h + 180) % 360;
  return [
    color,
    { ...color, h: (complementary - 30 + 360) % 360 },
    { ...color, h: (complementary + 30) % 360 },
  ];
}

/**
 * Get all harmony relationships for a color
 */
export function getAllHarmonies(color: OKLCHColor): ColorHarmony[] {
  return [
    { type: 'complementary', colors: [color, getComplementaryColor(color)] },
    { type: 'analogous', colors: getAnalogousColors(color) },
    { type: 'triadic', colors: getTriadicColors(color) },
    { type: 'tetradic', colors: getTetradicColors(color) },
    { type: 'split-complementary', colors: getSplitComplementaryColors(color) },
  ];
}

// ============================================================================
// Accessibility - WCAG Contrast
// ============================================================================

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  return wcagContrast(hex1, hex2);
}

/**
 * Get detailed contrast analysis
 */
export function analyzeContrast(foreground: string, background: string): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio,
    wcagLevel: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'A' : 'fail',
    largeTextAAA: ratio >= 4.5,
    largeTextAA: ratio >= 3,
    normalTextAAA: ratio >= 7,
    normalTextAA: ratio >= 4.5,
  };
}

/**
 * Get accessible text color (black or white) for a given background color.
 * Uses OKLCH lightness to determine contrast - colors with L > 0.6 get black text.
 *
 * @param backgroundColor - Hex color string (with or without #)
 * @returns "#000000" for light backgrounds, "#ffffff" for dark backgrounds
 *
 * @example
 * getAccessibleTextColor("#ffffff") // "#000000" (black text on white)
 * getAccessibleTextColor("#000000") // "#ffffff" (white text on black)
 * getAccessibleTextColor("#3b82f6") // "#ffffff" (white text on blue-500)
 */
export function getAccessibleTextColor(backgroundColor: string | null): string {
  if (!backgroundColor) return "#000000";
  try {
    const color = hexToOKLCH(backgroundColor);
    return color.l > 0.6 ? "#000000" : "#ffffff";
  } catch {
    return "#000000";
  }
}

/**
 * Find all accessible color pairs from a palette
 */
export function findAccessiblePairs(
  colors: Array<{ nodeId: string; hex: string }>,
  minRatio: number = 4.5
): Array<{ fg: string; bg: string; ratio: number }> {
  const pairs: Array<{ fg: string; bg: string; ratio: number }> = [];

  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const ratio = getContrastRatio(colors[i].hex, colors[j].hex);
      if (ratio >= minRatio) {
        pairs.push({
          fg: colors[i].nodeId,
          bg: colors[j].nodeId,
          ratio,
        });
      }
    }
  }

  return pairs.sort((a, b) => b.ratio - a.ratio);
}

// ============================================================================
// Color Manipulation
// ============================================================================

/**
 * Adjust lightness by a percentage (perceptually uniform)
 */
export function adjustLightness(color: OKLCHColor, percentage: number): OKLCHColor {
  const newL = Math.max(0, Math.min(1, color.l * (1 + percentage / 100)));
  return { ...color, l: newL };
}

/**
 * Adjust chroma (saturation) by a percentage
 */
export function adjustChroma(color: OKLCHColor, percentage: number): OKLCHColor {
  const newC = Math.max(0, color.c * (1 + percentage / 100));
  return { ...color, c: newC };
}

/**
 * Rotate hue by degrees
 */
export function rotateHue(color: OKLCHColor, degrees: number): OKLCHColor {
  return { ...color, h: (color.h + degrees + 360) % 360 };
}

/**
 * Generate tints (lighter versions) of a color
 */
export function generateTints(color: OKLCHColor, count: number = 5): OKLCHColor[] {
  const tints: OKLCHColor[] = [];
  const step = (1 - color.l) / (count + 1);

  for (let i = 1; i <= count; i++) {
    tints.push({ ...color, l: color.l + step * i });
  }

  return tints;
}

/**
 * Generate shades (darker versions) of a color
 */
export function generateShades(color: OKLCHColor, count: number = 5): OKLCHColor[] {
  const shades: OKLCHColor[] = [];
  const step = color.l / (count + 1);

  for (let i = 1; i <= count; i++) {
    shades.push({ ...color, l: color.l - step * i });
  }

  return shades;
}

/**
 * Generate a complete tint/shade scale
 */
export function generateScale(color: OKLCHColor, steps: number = 9): OKLCHColor[] {
  const scale: OKLCHColor[] = [];
  
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    scale.push({ ...color, l: t });
  }
  
  return scale;
}

// ============================================================================
// Color Clustering (K-means in OKLCH space)
// ============================================================================

/**
 * K-means clustering in OKLCH space
 */
export function clusterColors(
  colors: Array<{ nodeId: string; oklch: OKLCHColor }>,
  k: number = 5,
  maxIterations: number = 50
): ColorCluster[] {
  if (colors.length < k) {
    // Not enough colors to cluster
    return colors.map((c, i) => ({
      id: `cluster-${i}`,
      name: `Color ${i + 1}`,
      colors: [c.nodeId],
      centroid: c.oklch,
      avgLightness: c.oklch.l,
      avgChroma: c.oklch.c,
      avgHue: c.oklch.h,
    }));
  }

  // Initialize centroids using k-means++
  const centroids: OKLCHColor[] = [];
  const usedIndices = new Set<number>();
  
  // First centroid is random
  const firstIdx = Math.floor(Math.random() * colors.length);
  centroids.push({ ...colors[firstIdx].oklch });
  usedIndices.add(firstIdx);

  // Remaining centroids chosen based on distance
  for (let i = 1; i < k; i++) {
    const distances = colors.map((c, idx) => {
      if (usedIndices.has(idx)) return -1;
      const minDist = Math.min(...centroids.map(cent => getPerceptualDistance(c.oklch, cent)));
      return minDist;
    });
    
    const maxDist = Math.max(...distances);
    const nextIdx = distances.indexOf(maxDist);
    centroids.push({ ...colors[nextIdx].oklch });
    usedIndices.add(nextIdx);
  }

  // K-means iterations
  let assignments: number[] = new Array(colors.length).fill(0);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each color to nearest centroid
    const newAssignments = colors.map((c) => {
      let minDist = Infinity;
      let closestCluster = 0;
      
      centroids.forEach((centroid, idx) => {
        const dist = getPerceptualDistance(c.oklch, centroid);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = idx;
        }
      });
      
      return closestCluster;
    });

    // Check for convergence
    if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) {
      break;
    }
    assignments = newAssignments;

    // Update centroids
    for (let i = 0; i < k; i++) {
      const clusterColors = colors.filter((_, idx) => assignments[idx] === i);
      if (clusterColors.length === 0) continue;

      // Convert to Cartesian for averaging
      let sumL = 0, sumA = 0, sumB = 0;
      clusterColors.forEach((c) => {
        sumL += c.oklch.l;
        sumA += c.oklch.c * Math.cos((c.oklch.h * Math.PI) / 180);
        sumB += c.oklch.c * Math.sin((c.oklch.h * Math.PI) / 180);
      });

      const avgL = sumL / clusterColors.length;
      const avgA = sumA / clusterColors.length;
      const avgB = sumB / clusterColors.length;
      const avgC = Math.sqrt(avgA * avgA + avgB * avgB);
      const avgH = (Math.atan2(avgB, avgA) * 180) / Math.PI;

      centroids[i] = {
        l: avgL,
        c: avgC,
        h: (avgH + 360) % 360,
      };
    }
  }

  // Build cluster results
  const clusters: ColorCluster[] = [];
  for (let i = 0; i < k; i++) {
    const clusterColors = colors.filter((_, idx) => assignments[idx] === i);
    if (clusterColors.length === 0) continue;

    const avgL = clusterColors.reduce((sum, c) => sum + c.oklch.l, 0) / clusterColors.length;
    const avgC = clusterColors.reduce((sum, c) => sum + c.oklch.c, 0) / clusterColors.length;
    const avgH = clusterColors.reduce((sum, c) => sum + c.oklch.h, 0) / clusterColors.length;

    clusters.push({
      id: `cluster-${i}`,
      name: getClusterName(centroids[i]),
      colors: clusterColors.map((c) => c.nodeId),
      centroid: centroids[i],
      avgLightness: avgL,
      avgChroma: avgC,
      avgHue: avgH,
    });
  }

  return clusters;
}

/**
 * Generate a human-readable name for a color cluster
 */
function getClusterName(centroid: OKLCHColor): string {
  const { l, c, h } = centroid;

  // Determine lightness descriptor
  let lightnessName = '';
  if (l < 0.2) lightnessName = 'Dark ';
  else if (l > 0.8) lightnessName = 'Light ';

  // Determine saturation descriptor
  if (c < 0.02) return lightnessName + 'Neutrals';

  // Determine hue name
  let hueName = '';
  if (h >= 0 && h < 30) hueName = 'Reds';
  else if (h >= 30 && h < 60) hueName = 'Oranges';
  else if (h >= 60 && h < 90) hueName = 'Yellows';
  else if (h >= 90 && h < 150) hueName = 'Greens';
  else if (h >= 150 && h < 210) hueName = 'Cyans';
  else if (h >= 210 && h < 270) hueName = 'Blues';
  else if (h >= 270 && h < 330) hueName = 'Purples';
  else hueName = 'Magentas';

  return lightnessName + hueName;
}

// ============================================================================
// Curve Fitting & Interpolation
// ============================================================================

/**
 * Fit a smooth curve through colors in OKLCH space
 * Returns interpolated colors along the curve
 */
export function fitColorCurve(
  colors: OKLCHColor[],
  sampleCount: number = 20
): OKLCHColor[] {
  if (colors.length < 2) return colors;

  // Sort colors by lightness for smooth progression
  const sorted = [...colors].sort((a, b) => a.l - b.l);

  // Use Catmull-Rom spline interpolation
  const curve: OKLCHColor[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const idx = t * (sorted.length - 1);
    const i0 = Math.max(0, Math.floor(idx) - 1);
    const i1 = Math.floor(idx);
    const i2 = Math.min(sorted.length - 1, Math.ceil(idx));
    const i3 = Math.min(sorted.length - 1, i2 + 1);
    
    const localT = idx - i1;

    // Catmull-Rom interpolation for each component
    const l = catmullRom(sorted[i0].l, sorted[i1].l, sorted[i2].l, sorted[i3].l, localT);
    const c = catmullRom(sorted[i0].c, sorted[i1].c, sorted[i2].c, sorted[i3].c, localT);
    
    // Special handling for hue (circular interpolation)
    const h = interpolateHue(sorted[i1].h, sorted[i2].h, localT);

    curve.push({ l, c, h });
  }

  return curve;
}

/**
 * Catmull-Rom spline interpolation
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

/**
 * Circular interpolation for hue (handles 0-360 wraparound)
 */
function interpolateHue(h1: number, h2: number, t: number): number {
  let delta = h2 - h1;
  
  // Take shortest path around the circle
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  
  return (h1 + delta * t + 360) % 360;
}

/**
 * Detect gaps in color progression
 */
export function detectColorGaps(
  colors: OKLCHColor[],
  threshold: number = 0.15
): Array<{ before: OKLCHColor; after: OKLCHColor; gap: number }> {
  const sorted = [...colors].sort((a, b) => a.l - b.l);
  const gaps: Array<{ before: OKLCHColor; after: OKLCHColor; gap: number }> = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const distance = getPerceptualDistance(sorted[i], sorted[i + 1]);
    if (distance > threshold) {
      gaps.push({
        before: sorted[i],
        after: sorted[i + 1],
        gap: distance,
      });
    }
  }

  return gaps;
}

