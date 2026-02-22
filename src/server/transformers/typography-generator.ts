/**
 * Pure typography scale generation functions
 * Ported from interface-machine's brand/core/typography.ts
 */

export const TYPOGRAPHIC_SCALES = {
  minorSecond: 1.067,
  majorSecond: 1.125,
  minorThird: 1.2,
  majorThird: 1.25,
  perfectFourth: 1.333,
  augmentedFourth: 1.414,
  perfectFifth: 1.5,
  goldenRatio: 1.618
} as const;

export type LineHeightStrategy = 'tight' | 'normal' | 'loose';

export interface TypographySeedInput {
  baseTypography: {
    heading: string;
    body: string;
    caption: string;
    monospace: string;
  };
  scale: {
    sizeRatio: number;
    baseSizes: {
      sm: number;
      md: number;
      lg: number;
    };
    steps: {
      heading: number;
      body: number;
      caption: number;
    };
    lineHeightBands: {
      heading: { min: number; max: number; profile: LineHeightStrategy };
      body: { min: number; max: number; profile: LineHeightStrategy };
      caption: { min: number; max: number; profile: LineHeightStrategy };
    };
    rhythm: {
      grid: number;
      round: 'up' | 'down' | 'nearest';
    };
  };
}

export interface TypographyTokens {
  families: {
    heading: string;
    body: string;
    caption: string;
    monospace: string;
  };
  sizeTokens: Array<{ name: string; value: string }>;
  lhTokens: Array<{ name: string; value: number }>;
  meta: {
    ratio: number;
    baseBody: number;
    rhythm: {
      grid: number;
      round: 'up' | 'down' | 'nearest';
    };
  };
}

type Role = 'heading' | 'body' | 'caption';

function roundToGrid(px: number, grid: number, mode: 'up' | 'down' | 'nearest') {
  const n = px / grid;
  const r = mode === 'up' ? Math.ceil(n) : mode === 'down' ? Math.floor(n) : Math.round(n);
  return r * grid;
}

const easing = {
  tight:   (t: number) => 1 - Math.pow(1 - t, 2),
  normal:  (t: number) => t,
  loose:   (t: number) => Math.pow(t, 0.75),
};

function lineHeightAt(t: number, min: number, max: number, profile: LineHeightStrategy) {
  const e = easing[profile](t);
  return min + (max - min) * (1 - e);
}

function buildScale(basePx: number, ratio: number, n: number) {
  return Array.from({ length: n }, (_, i) => basePx * Math.pow(ratio, i));
}

/**
 * Generate complete typography tokens from a seed configuration
 * This is the main deterministic function for typography generation
 */
export function generateTypographyTokens(
  seed: TypographySeedInput,
  breakpoint: keyof TypographySeedInput['scale']['baseSizes'] = 'md'
): TypographyTokens {
  const { sizeRatio, baseSizes, steps, lineHeightBands, rhythm } = seed.scale;
  const baseBody = baseSizes[breakpoint];

  // Raw scales
  const bodySizes    = buildScale(baseBody, sizeRatio, steps.body);
  const headingBase  = baseBody * Math.pow(sizeRatio, 2);
  const headingSizes = buildScale(headingBase, sizeRatio, steps.heading);
  const captionBase  = baseBody / sizeRatio;
  const captionSizes = buildScale(captionBase, 1 / sizeRatio, steps.caption).reverse();

  // Round to grid
  const rs = (px: number) => roundToGrid(px, rhythm.grid, rhythm.round);
  const rounded = {
    heading: headingSizes.map(rs),
    body:    bodySizes.map(rs),
    caption: captionSizes.map(rs),
  };

  // Line-heights per role
  function lhFor(role: Role, i: number, len: number) {
    const { min, max, profile } = lineHeightBands[role];
    const t = len <= 1 ? 0 : i / (len - 1);
    return parseFloat(lineHeightAt(t, min, max, profile).toFixed(2));
  }

  const lh = {
    heading: rounded.heading.map((_, i, arr) => lhFor('heading', i, arr.length)),
    body:    rounded.body.map   ((_, i, arr) => lhFor('body',    i, arr.length)),
    caption: rounded.caption.map((_, i, arr) => lhFor('caption', i, arr.length)),
  };

  // Tokens
  const sizeTokens = [
    ...rounded.heading.map((v, i) => ({ name: `heading.${i}`, value: `${v}px` })),
    ...rounded.body.map   ((v, i) => ({ name: `body.${i}`,    value: `${v}px` })),
    ...rounded.caption.map((v, i) => ({ name: `caption.${i}`, value: `${v}px` })),
  ];

  const lhTokens = [
    ...lh.heading.map((v, i) => ({ name: `heading.${i}`, value: v })),
    ...lh.body.map   ((v, i) => ({ name: `body.${i}`,    value: v })),
    ...lh.caption.map((v, i) => ({ name: `caption.${i}`, value: v })),
  ];

  return {
    families: seed.baseTypography,
    sizeTokens,
    lhTokens,
    meta: { ratio: sizeRatio, baseBody, rhythm },
  };
}

