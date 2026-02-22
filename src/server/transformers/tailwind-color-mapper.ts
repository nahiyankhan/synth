/**
 * Tailwind Color Mapper
 *
 * Maps arbitrary hues to Tailwind color names and handles
 * overlap detection between brand colors and status colors.
 */

import {
  type TailwindChromaticColor,
  type ColorSeed,
  type GraySeed,
  type ColorSeeds,
  type ResolvedPalette,
  type GeneratedPalettes,
  type PaletteOverlap,
  type PaletteRole,
  type RoleMapping,
  TAILWIND_HUE_RANGES,
  DEFAULT_STATUS_SEEDS,
} from '../../types/tailwindPalette';

import { generateScale, generateGrayScale } from './tailwind-palette-generator';

// =============================================================================
// Hue to Tailwind Name Mapping
// =============================================================================

/**
 * Map a hue angle to the nearest Tailwind color name
 *
 * @param hue - Hue angle (0-360)
 * @returns Tailwind color name
 */
export function hueToTailwindName(hue: number): TailwindChromaticColor {
  const normalizedHue = ((hue % 360) + 360) % 360;

  for (const [name, [start, end]] of Object.entries(TAILWIND_HUE_RANGES)) {
    if (start > end) {
      // Wraps around 360 (like rose: 345-10)
      if (normalizedHue >= start || normalizedHue < end) {
        return name as TailwindChromaticColor;
      }
    } else {
      if (normalizedHue >= start && normalizedHue < end) {
        return name as TailwindChromaticColor;
      }
    }
  }

  // Fallback (shouldn't happen with complete ranges)
  return 'blue';
}

/**
 * Check if two hues are "close enough" to be considered overlapping
 *
 * @param hue1 - First hue angle
 * @param hue2 - Second hue angle
 * @param threshold - Maximum difference to consider overlapping (default: 15°)
 * @returns true if hues are within threshold
 */
export function huesOverlap(hue1: number, hue2: number, threshold: number = 15): boolean {
  const diff = Math.abs(hue1 - hue2);
  return diff < threshold || diff > (360 - threshold);
}

/**
 * Get the canonical (center) hue for a Tailwind color name
 *
 * @param name - Tailwind color name
 * @returns Center hue of the color's range
 */
export function getTailwindCanonicalHue(name: TailwindChromaticColor): number {
  const ranges = TAILWIND_HUE_RANGES[name];
  if (ranges[0] > ranges[1]) {
    // Wraps around - return middle accounting for wrap
    return (ranges[0] + (ranges[1] + 360 - ranges[0]) / 2) % 360;
  }
  return (ranges[0] + ranges[1]) / 2;
}

// =============================================================================
// Palette Resolution with Overlap Detection
// =============================================================================

interface PaletteAllocation {
  name: TailwindChromaticColor | 'gray';
  seed: ColorSeed | GraySeed;
  role: PaletteRole;
  sourceRole: string;
  priority: number;
}

/**
 * Resolve all color seeds into Tailwind-named palettes
 * Handles overlaps between brand colors and status colors
 *
 * @param seeds - Complete color seeds from LLM
 * @returns Generated palettes with overlap resolution
 */
export function resolveColorSeeds(seeds: ColorSeeds): GeneratedPalettes {
  const allocations: PaletteAllocation[] = [];
  const claimedNames = new Map<TailwindChromaticColor | 'gray', PaletteAllocation>();
  const overlaps: PaletteOverlap[] = [];

  /**
   * Try to allocate a palette name
   * Returns true if allocated, false if already claimed
   */
  function allocate(
    name: TailwindChromaticColor | 'gray',
    seed: ColorSeed | GraySeed,
    role: PaletteRole,
    sourceRole: string,
    priority: number
  ): boolean {
    const existing = claimedNames.get(name);

    if (!existing) {
      const allocation: PaletteAllocation = { name, seed, role, sourceRole, priority };
      claimedNames.set(name, allocation);
      allocations.push(allocation);
      return true;
    }

    // Name already claimed - record overlap
    overlaps.push({
      role: sourceRole,
      requestedHue: 'hue' in seed ? seed.hue : 0,
      mappedTo: name as TailwindChromaticColor,
      conflictedWith: existing.sourceRole,
      resolution: 'merged',
    });

    return false;
  }

  // 1. Always allocate gray first (highest priority)
  allocate('gray', seeds.gray, 'neutral', 'gray', 0);

  // 2. Allocate status colors (fixed names, high priority)
  const statusSeeds = {
    success: seeds.status?.success ?? DEFAULT_STATUS_SEEDS.success,
    warning: seeds.status?.warning ?? DEFAULT_STATUS_SEEDS.warning,
    error: seeds.status?.error ?? DEFAULT_STATUS_SEEDS.error,
    info: seeds.status?.info ?? DEFAULT_STATUS_SEEDS.info,
  };

  allocate('green', statusSeeds.success, 'status', 'status.success', 1);
  allocate('amber', statusSeeds.warning, 'status', 'status.warning', 1);
  allocate('red', statusSeeds.error, 'status', 'status.error', 1);
  allocate('blue', statusSeeds.info, 'status', 'status.info', 1);

  // 3. Allocate brand primary (map to nearest Tailwind name)
  const brandPrimary = seeds.brand.primary;
  const primaryName = hueToTailwindName(brandPrimary.hue);
  allocate(primaryName, brandPrimary, 'brand-primary', 'brand.primary', 2);

  // 4. Allocate brand secondary (if provided)
  if (seeds.brand.secondary) {
    const secondaryName = hueToTailwindName(seeds.brand.secondary.hue);
    allocate(secondaryName, seeds.brand.secondary, 'brand-secondary', 'brand.secondary', 3);
  }

  // 5. Allocate brand tertiary (if provided)
  if (seeds.brand.tertiary) {
    const tertiaryName = hueToTailwindName(seeds.brand.tertiary.hue);
    allocate(tertiaryName, seeds.brand.tertiary, 'brand-tertiary', 'brand.tertiary', 4);
  }

  // 6. Allocate accent colors (if provided)
  if (seeds.accents) {
    seeds.accents.forEach((accent, i) => {
      const accentName = hueToTailwindName(accent.hue);
      allocate(accentName, accent, 'brand-accent', `accents[${i}]`, 5 + i);
    });
  }

  // 7. Generate actual palettes for all allocations
  const palettes = new Map<string, ResolvedPalette>();

  for (const allocation of allocations) {
    const isGray = allocation.name === 'gray';

    const palette: ResolvedPalette = {
      name: allocation.name,
      light: isGray
        ? generateGrayScale(allocation.seed as GraySeed, 'light')
        : generateScale(allocation.seed as ColorSeed, 'light'),
      dark: isGray
        ? generateGrayScale(allocation.seed as GraySeed, 'dark')
        : generateScale(allocation.seed as ColorSeed, 'dark'),
      role: allocation.role,
      seed: allocation.seed,
    };

    palettes.set(allocation.name, palette);
  }

  // 8. Build role mapping
  const roleMapping = buildRoleMapping(seeds, allocations, overlaps);

  return {
    palettes,
    roleMapping,
    overlaps,
  };
}

/**
 * Build the role mapping showing which Tailwind name each role uses
 */
function buildRoleMapping(
  seeds: ColorSeeds,
  allocations: PaletteAllocation[],
  overlaps: PaletteOverlap[]
): RoleMapping {
  // Find the name for a given source role
  const findNameForRole = (sourceRole: string): TailwindChromaticColor | undefined => {
    // First check if it was directly allocated
    const allocation = allocations.find((a) => a.sourceRole === sourceRole && a.name !== 'gray');
    if (allocation) {
      return allocation.name as TailwindChromaticColor;
    }

    // If overlapped, find what it was merged into
    const overlap = overlaps.find((o) => o.role === sourceRole);
    if (overlap) {
      return overlap.mappedTo;
    }

    return undefined;
  };

  // Primary always exists
  const primaryMapping =
    findNameForRole('brand.primary') ?? hueToTailwindName(seeds.brand.primary.hue);

  // Secondary may not exist or may be overlapped
  const secondaryMapping = seeds.brand.secondary
    ? findNameForRole('brand.secondary') ?? hueToTailwindName(seeds.brand.secondary.hue)
    : undefined;

  // Tertiary may not exist or may be overlapped
  const tertiaryMapping = seeds.brand.tertiary
    ? findNameForRole('brand.tertiary') ?? hueToTailwindName(seeds.brand.tertiary.hue)
    : undefined;

  // Accents
  const accentMappings = (seeds.accents ?? []).map(
    (accent, i) => findNameForRole(`accents[${i}]`) ?? hueToTailwindName(accent.hue)
  );

  return {
    primary: primaryMapping,
    secondary: secondaryMapping,
    tertiary: tertiaryMapping,
    accents: accentMappings,
    success: 'green',
    warning: 'amber',
    error: 'red',
    info: 'blue',
    neutral: 'gray',
  };
}
