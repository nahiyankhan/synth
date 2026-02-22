/**
 * Tests for Tailwind Color System
 */

import { describe, it, expect } from 'vitest';
import {
  generateColorSystem,
  generateScale,
  generateGrayScale,
  hueToTailwindName,
  resolveColorSeeds,
  TAILWIND_STEPS,
  type ColorSeeds,
  type ColorSeed,
  type GraySeed,
} from './tailwind-color-system';

describe('tailwind-palette-generator', () => {
  describe('generateScale', () => {
    it('generates 11-step scale from seed', () => {
      const seed: ColorSeed = { hue: 220, chroma: 0.18 };
      const scale = generateScale(seed, 'light');

      expect(scale).toHaveLength(11);
      expect(scale.every((color) => color.startsWith('#'))).toBe(true);
    });

    it('generates different scales for light and dark modes', () => {
      const seed: ColorSeed = { hue: 220, chroma: 0.18 };
      const lightScale = generateScale(seed, 'light');
      const darkScale = generateScale(seed, 'dark');

      // Light mode 50 should be lighter than dark mode 50
      expect(lightScale[0]).not.toBe(darkScale[0]);
    });

    it('handles edge case hues', () => {
      const seeds: ColorSeed[] = [
        { hue: 0, chroma: 0.18 },
        { hue: 360, chroma: 0.18 },
        { hue: -10, chroma: 0.18 },
        { hue: 370, chroma: 0.18 },
      ];

      for (const seed of seeds) {
        const scale = generateScale(seed, 'light');
        expect(scale).toHaveLength(11);
      }
    });
  });

  describe('generateGrayScale', () => {
    it('generates 11-step gray scale', () => {
      const seed: GraySeed = { warmth: 0.2, saturation: 0.015 };
      const scale = generateGrayScale(seed, 'light');

      expect(scale).toHaveLength(11);
    });

    it('warm grays have warm hue, cool grays have cool hue', () => {
      const warmSeed: GraySeed = { warmth: 0.5, saturation: 0.02 };
      const coolSeed: GraySeed = { warmth: -0.5, saturation: 0.02 };

      const warmScale = generateGrayScale(warmSeed, 'light');
      const coolScale = generateGrayScale(coolSeed, 'light');

      // They should produce different results
      expect(warmScale[5]).not.toBe(coolScale[5]);
    });
  });
});

describe('tailwind-color-mapper', () => {
  describe('hueToTailwindName', () => {
    it('maps hues to correct Tailwind names', () => {
      expect(hueToTailwindName(0)).toBe('rose');
      expect(hueToTailwindName(25)).toBe('red');
      expect(hueToTailwindName(55)).toBe('amber');
      expect(hueToTailwindName(120)).toBe('green'); // green is 105-140
      expect(hueToTailwindName(145)).toBe('emerald'); // emerald is 140-165
      expect(hueToTailwindName(175)).toBe('teal');
      expect(hueToTailwindName(220)).toBe('blue');
      expect(hueToTailwindName(290)).toBe('purple'); // purple is 285-310
      expect(hueToTailwindName(350)).toBe('rose');
    });

    it('handles hue wrap-around', () => {
      expect(hueToTailwindName(360)).toBe('rose');
      expect(hueToTailwindName(365)).toBe('rose');
      expect(hueToTailwindName(-5)).toBe('rose');
    });
  });

  describe('resolveColorSeeds', () => {
    it('generates minimum 5 palettes (gray + 4 status)', () => {
      const seeds: ColorSeeds = {
        brand: {
          primary: { hue: 220, chroma: 0.18 },
        },
        gray: { warmth: 0.2, saturation: 0.012 },
      };

      const result = resolveColorSeeds(seeds);

      expect(result.palettes.size).toBeGreaterThanOrEqual(5);
      expect(result.palettes.has('gray')).toBe(true);
      expect(result.palettes.has('green')).toBe(true);
      expect(result.palettes.has('amber')).toBe(true);
      expect(result.palettes.has('red')).toBe(true);
      expect(result.palettes.has('blue')).toBe(true);
    });

    it('detects overlap when brand matches status color', () => {
      const seeds: ColorSeeds = {
        brand: {
          primary: { hue: 220, chroma: 0.18 }, // Blue - overlaps with info
        },
        gray: { warmth: 0.2, saturation: 0.012 },
      };

      const result = resolveColorSeeds(seeds);

      // Primary should map to blue, which is also info
      expect(result.roleMapping.primary).toBe('blue');
      expect(result.overlaps.length).toBeGreaterThan(0);
    });

    it('generates unique palette for non-overlapping brand', () => {
      const seeds: ColorSeeds = {
        brand: {
          primary: { hue: 175, chroma: 0.14 }, // Teal - unique
        },
        gray: { warmth: 0.2, saturation: 0.012 },
      };

      const result = resolveColorSeeds(seeds);

      expect(result.palettes.has('teal')).toBe(true);
      expect(result.roleMapping.primary).toBe('teal');
    });
  });
});

describe('generateColorSystem', () => {
  it('generates complete color system from seeds', () => {
    const seeds: ColorSeeds = {
      brand: {
        primary: { hue: 175, chroma: 0.14 },
        secondary: { hue: 280, chroma: 0.10 },
      },
      accents: [{ hue: 320, chroma: 0.16 }],
      gray: { warmth: 0.2, saturation: 0.012 },
    };

    const result = generateColorSystem(seeds);

    // Check structure
    expect(result.seeds).toBe(seeds);
    expect(result.palettes).toBeDefined();
    expect(result.semantics).toBeDefined();
    expect(result.css).toBeDefined();
    expect(result.summary).toBeDefined();

    // Check CSS output
    expect(result.css).toContain('@theme {');
    expect(result.css).toContain('@theme dark {');
    expect(result.css).toContain('--color-gray-');
    expect(result.css).toContain('--color-background');
    expect(result.css).toContain('--color-primary');

    // Check semantic tokens
    expect(result.semantics.light.background).toBeDefined();
    expect(result.semantics.light.primary).toBeDefined();
    expect(result.semantics.dark.background).toBeDefined();
    expect(result.semantics.dark.primary).toBeDefined();

    // Check summary
    expect(result.summary.paletteCount).toBeGreaterThanOrEqual(5);
    expect(result.summary.paletteNames).toContain('gray');
  });

  it('handles minimal seeds', () => {
    const seeds: ColorSeeds = {
      brand: {
        primary: { hue: 220, chroma: 0.18 },
      },
      gray: { warmth: 0, saturation: 0 },
    };

    const result = generateColorSystem(seeds);

    expect(result.palettes.palettes.size).toBeGreaterThanOrEqual(5);
    expect(result.css.length).toBeGreaterThan(0);
  });

  it('CSS contains all Tailwind steps', () => {
    const seeds: ColorSeeds = {
      brand: {
        primary: { hue: 220, chroma: 0.18 },
      },
      gray: { warmth: 0.2, saturation: 0.012 },
    };

    const result = generateColorSystem(seeds);

    for (const step of TAILWIND_STEPS) {
      expect(result.css).toContain(`--color-gray-${step}:`);
    }
  });
});
