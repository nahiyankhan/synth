/**
 * Tailwind v4 CSS Configuration Generator
 *
 * Generates CSS that remaps Tailwind's default classes to design system tokens.
 * Tailwind v4 uses CSS-first configuration with @theme directive.
 * 
 * Enhanced to aggressively remap all standard Tailwind classes to design tokens.
 */

import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { TAILWIND_STEPS } from "@/types/tailwindPalette";

interface TailwindColorMapping {
  [key: string]: {
    light?: string;
    dark?: string;
    scales?: Record<number, { light?: string; dark?: string }>;
  };
}

interface TailwindSpacingMapping {
  [key: string]: string;
}

interface TailwindTypographyMapping {
  fontFamily: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
}

interface TailwindRadiusMapping {
  [key: string]: string;
}

interface TailwindShadowMapping {
  [key: string]: string;
}

interface TailwindEffectsMapping {
  opacity: Record<string, string>;
  blur: Record<string, string>;
  zIndex: Record<string, string>;
}

/**
 * Tailwind's border radius scale
 */
const TAILWIND_RADIUS_SCALE: Record<string, string> = {
  'none': '0px',
  'sm': '0.125rem',
  'DEFAULT': '0.25rem',
  'md': '0.375rem',
  'lg': '0.5rem',
  'xl': '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  'full': '9999px',
};

/**
 * Complete list of Tailwind's default color names for intelligent mapping
 */
const TAILWIND_COLOR_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 
  'fuchsia', 'pink', 'rose'
] as const;

/**
 * Tailwind's standard color scale values
 */
const TAILWIND_COLOR_SCALE = TAILWIND_STEPS;

/**
 * Tailwind's standard spacing scale (maps to rem values)
 */
const TAILWIND_SPACING_SCALE: Record<string, string> = {
  '0': '0px',
  'px': '1px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
};

/**
 * Tailwind's typography scale names
 */
const TAILWIND_FONT_SIZES: Record<string, string> = {
  'xs': '0.75rem',
  'sm': '0.875rem',
  'base': '1rem',
  'lg': '1.125rem',
  'xl': '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem',
};

/**
 * Tailwind's shadow scale
 */
const TAILWIND_SHADOW_SCALE: Record<string, string> = {
  'sm': 'sm',
  'DEFAULT': 'DEFAULT',
  'md': 'md',
  'lg': 'lg',
  'xl': 'xl',
  '2xl': '2xl',
  'inner': 'inner',
  'none': 'none',
};

/**
 * Tailwind's opacity scale
 */
const TAILWIND_OPACITY_SCALE: Record<string, string> = {
  '0': '0',
  '5': '0.05',
  '10': '0.1',
  '20': '0.2',
  '25': '0.25',
  '30': '0.3',
  '40': '0.4',
  '50': '0.5',
  '60': '0.6',
  '70': '0.7',
  '75': '0.75',
  '80': '0.8',
  '90': '0.9',
  '95': '0.95',
  '100': '1',
};

/**
 * Tailwind's blur scale
 */
const TAILWIND_BLUR_SCALE: Record<string, string> = {
  'none': 'none',
  'sm': 'sm',
  'DEFAULT': 'DEFAULT',
  'md': 'md',
  'lg': 'lg',
  'xl': 'xl',
  '2xl': '2xl',
  '3xl': '3xl',
};

/**
 * Tailwind's z-index scale
 */
const TAILWIND_Z_INDEX_SCALE: Record<string, string> = {
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  'auto': 'auto',
};

/**
 * Tailwind's font weight scale
 */
const TAILWIND_FONT_WEIGHTS: Record<string, string> = {
  'thin': '100',
  'extralight': '200',
  'light': '300',
  'normal': '400',
  'medium': '500',
  'semibold': '600',
  'bold': '700',
  'extrabold': '800',
  'black': '900',
};

/**
 * Extract color scales from design system
 * Maps design tokens to Tailwind color names and scales
 * Enhanced to aggressively detect and map to standard Tailwind color names
 */
function extractColorScales(graph: StyleGraph): TailwindColorMapping {
  const colors: TailwindColorMapping = {};
  const nodes = Array.from(graph.nodes.values());

  // Find all color tokens
  const colorNodes = nodes.filter((n) => n.type === "color");

  // Group by semantic purpose or color family
  for (const node of colorNodes) {
    const parts = node.name.split(".");
    const nodeName = node.name.toLowerCase();

    // Handle semantic colors (e.g., "semantic.color.text.primary")
    if (parts.includes("semantic")) {
      const semantic = extractSemanticColor(node, parts);
      if (semantic) {
        Object.assign(colors, semantic);
      }
      continue;
    }

    // Handle base colors with scales (e.g., "base.color.blue.500")
    if (parts.includes("base") && parts.includes("color")) {
      const baseColor = extractBaseColor(node, parts);
      if (baseColor) {
        Object.assign(colors, baseColor);
      }
      continue;
    }

    // Intelligently detect Tailwind color names in any token path
    // E.g., "primitives.blue.500" or "colors.slate.200" should map to Tailwind
    const detectedColor = detectTailwindColorName(nodeName, parts);
    if (detectedColor) {
      const mapped = mapToTailwindColor(node, detectedColor.colorName, detectedColor.scale);
      if (mapped) {
        // Merge scales if color already exists
        if (colors[detectedColor.colorName]) {
          if (!colors[detectedColor.colorName].scales) {
            colors[detectedColor.colorName].scales = {};
          }
          Object.assign(colors[detectedColor.colorName].scales!, mapped[detectedColor.colorName].scales || {});
        } else {
          Object.assign(colors, mapped);
        }
      }
      continue;
    }

    // Handle component colors
    if (parts.includes("component")) {
      const componentColor = extractComponentColor(node, parts);
      if (componentColor) {
        Object.assign(colors, componentColor);
      }
    }
  }

  return colors;
}

/**
 * Detect if a token path contains a standard Tailwind color name and scale
 */
function detectTailwindColorName(
  nodeName: string, 
  parts: string[]
): { colorName: string; scale: number | null } | null {
  // Check each part for a Tailwind color name
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    
    if (TAILWIND_COLOR_NAMES.includes(part as any)) {
      // Found a color name! Check if next part is a scale number
      const nextPart = parts[i + 1];
      const scale = nextPart ? parseInt(nextPart) : null;
      
      if (scale !== null && !isNaN(scale) && TAILWIND_COLOR_SCALE.includes(scale as any)) {
        return { colorName: part, scale };
      }
      
      // Color name without scale - could be a simple token
      return { colorName: part, scale: null };
    }
  }
  
  return null;
}

/**
 * Map a node to a Tailwind color with optional scale
 */
function mapToTailwindColor(
  node: StyleNode,
  colorName: string,
  scale: number | null
): TailwindColorMapping | null {
  const lightValue = typeof node.value === "object" ? node.value.light : node.value;
  const darkValue = typeof node.value === "object" ? node.value.dark : undefined;

  if (!lightValue && !darkValue) return null;

  if (scale !== null) {
    // Map to color scale (e.g., blue-500)
    return {
      [colorName]: {
        scales: {
          [scale]: { light: lightValue, dark: darkValue }
        }
      }
    };
  } else {
    // Map to base color
    return {
      [colorName]: {
        light: lightValue,
        dark: darkValue
      }
    };
  }
}

function extractSemanticColor(
  node: StyleNode,
  parts: string[]
): TailwindColorMapping | null {
  // Map semantic tokens to Tailwind equivalents
  // Comprehensive mapping covering all common Tailwind semantic colors
  const semanticMappings: Record<string, string> = {
    // Text colors - extensive variations
    "text.primary": "foreground",
    "text.base": "foreground",
    "text.default": "foreground",
    "text.secondary": "muted-foreground",
    "text.muted": "muted-foreground",
    "text.subtle": "muted-foreground",
    "text.disabled": "muted-foreground",
    "text.placeholder": "muted-foreground",
    "text.inverse": "primary-foreground",
    "text.inverted": "primary-foreground",
    "text.on-primary": "primary-foreground",
    "text.on-accent": "accent-foreground",
    
    // Background colors - all variations
    "background.app": "background",
    "background.base": "background",
    "background.default": "background",
    "background.primary": "background",
    "background.surface": "card",
    "background.card": "card",
    "background.elevated": "card",
    "background.overlay": "popover",
    "background.popover": "popover",
    "background.dropdown": "popover",
    "background.muted": "muted",
    "background.subtle": "muted",
    "background.accent": "accent",
    "background.secondary": "secondary",
    
    // Border colors - comprehensive
    "border.standard": "border",
    "border.default": "border",
    "border.base": "border",
    "border.primary": "border",
    "border.subtle": "input",
    "border.muted": "input",
    "border.input": "input",
    "border.focus": "ring",
    "border.accent": "accent",
    
    // Accent/Brand colors
    "accent.primary": "primary",
    "accent.default": "primary",
    "brand.primary": "primary",
    "brand.default": "primary",
    "accent.secondary": "secondary",
    "brand.secondary": "secondary",
    
    // State colors - all semantic states
    "accent.success": "success",
    "state.success": "success",
    "success": "success",
    "positive": "success",
    "accent.warning": "warning",
    "state.warning": "warning",
    "warning": "warning",
    "caution": "warning",
    "accent.error": "destructive",
    "state.error": "destructive",
    "error": "destructive",
    "destructive": "destructive",
    "danger": "destructive",
    "negative": "destructive",
    "accent.info": "info",
    "state.info": "info",
    "info": "info",
    "informational": "info",
    
    // Ring (focus) colors
    "ring.focus": "ring",
    "ring.default": "ring",
    "focus.ring": "ring",
    "focus.default": "ring",
    "ring": "ring",
    
    // Additional semantic mappings
    "link": "primary",
    "link.default": "primary",
    "link.hover": "primary",
    "selection": "primary",
    "highlight": "primary",
  };

  const colorIndex = parts.indexOf("color");
  if (colorIndex === -1 || colorIndex + 1 >= parts.length) return null;

  const semanticPath = parts.slice(colorIndex + 1).join(".");
  
  // Try exact match first
  let tailwindName = semanticMappings[semanticPath];
  
  // If no exact match, try partial matches
  if (!tailwindName) {
    for (const [pattern, name] of Object.entries(semanticMappings)) {
      if (semanticPath.includes(pattern) || pattern.includes(semanticPath)) {
        tailwindName = name;
        break;
      }
    }
  }

  if (tailwindName && node.value) {
    const lightValue =
      typeof node.value === "object" ? node.value.light : node.value;
    const darkValue =
      typeof node.value === "object" ? node.value.dark : undefined;

    return {
      [tailwindName]: {
        light: lightValue,
        dark: darkValue,
      },
    };
  }

  return null;
}

function extractBaseColor(
  node: StyleNode,
  parts: string[]
): TailwindColorMapping | null {
  const colorIndex = parts.indexOf("color");
  if (colorIndex === -1 || colorIndex + 2 >= parts.length) return null;

  const colorName = parts[colorIndex + 1]; // e.g., "blue", "grey"
  const scale = parts[colorIndex + 2]; // e.g., "500", "light"

  const lightValue =
    typeof node.value === "object" ? node.value.light : node.value;
  const darkValue =
    typeof node.value === "object" ? node.value.dark : undefined;

  // Map scale to Tailwind scale (50-950)
  const scaleNum = parseInt(scale);
  if (!isNaN(scaleNum)) {
    return {
      [colorName]: {
        scales: {
          [scaleNum]: {
            light: lightValue,
            dark: darkValue,
          },
        },
      },
    };
  }

  return null;
}

function extractComponentColor(
  node: StyleNode,
  parts: string[]
): TailwindColorMapping | null {
  // Component colors can map to Tailwind component utilities
  const componentName = parts[parts.indexOf("component") + 1];
  const colorPurpose = parts[parts.length - 1];

  const key = `${componentName}-${colorPurpose}`;

  const lightValue =
    typeof node.value === "object" ? node.value.light : node.value;
  const darkValue =
    typeof node.value === "object" ? node.value.dark : undefined;

  if (lightValue || darkValue) {
    return {
      [key]: {
        light: lightValue,
        dark: darkValue,
      },
    };
  }

  return null;
}

/**
 * Extract spacing scale from design system
 * Enhanced to intelligently map to Tailwind's full spacing scale
 */
function extractSpacing(graph: StyleGraph): TailwindSpacingMapping {
  const spacing: TailwindSpacingMapping = {};
  const nodes = Array.from(graph.nodes.values());

  // Find spacing tokens
  const spacingNodes = nodes.filter(
    (n) =>
      n.type === "spacing" ||
      n.name.includes("spacing") ||
      n.name.includes("space") ||
      n.name.includes("size") ||
      n.name.includes("gap") ||
      n.name.includes("padding") ||
      n.name.includes("margin")
  );

  for (const node of spacingNodes) {
    const parts = node.name.split(".");
    const lastPart = parts[parts.length - 1];
    const value = typeof node.value === "object" ? node.value.light : node.value;
    
    if (!value) continue;

    // Direct mapping: if the token already uses a Tailwind spacing key, use it
    if (TAILWIND_SPACING_SCALE[lastPart]) {
      spacing[lastPart] = value;
      continue;
    }

    // Semantic size mapping to Tailwind scale
    const semanticMap: Record<string, string> = {
      'none': '0',
      'xxs': '0.5',
      'xs': '1',
      'sm': '2',
      'md': '4',
      'lg': '6',
      'xl': '8',
      'xxl': '12',
      '2xl': '16',
      '3xl': '20',
      '4xl': '24',
      '5xl': '32',
      '6xl': '40',
      '7xl': '48',
      '8xl': '64',
      '9xl': '80',
    };

    if (semanticMap[lastPart]) {
      spacing[semanticMap[lastPart]] = value;
      continue;
    }

    // Try to infer from pixel values (e.g., "4px" -> "1", "16px" -> "4")
    const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) {
      const px = parseFloat(pxMatch[1]);
      const rem = px / 16; // Convert px to rem
      
      // Find closest Tailwind spacing key
      const closestKey = findClosestSpacingKey(rem);
      if (closestKey) {
        spacing[closestKey] = value;
        continue;
      }
    }

    // Try to infer from rem values
    const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
    if (remMatch) {
      const rem = parseFloat(remMatch[1]);
      const closestKey = findClosestSpacingKey(rem);
      if (closestKey) {
        spacing[closestKey] = value;
        continue;
      }
    }

    // Fallback: use the last part as the key if it looks like a number
    if (!isNaN(parseFloat(lastPart))) {
      spacing[lastPart] = value;
    }
  }

  return spacing;
}

/**
 * Find the closest Tailwind spacing key for a rem value
 */
function findClosestSpacingKey(remValue: number): string | null {
  let closestKey: string | null = null;
  let closestDiff = Infinity;

  for (const [key, value] of Object.entries(TAILWIND_SPACING_SCALE)) {
    // Parse the value to get rem
    const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
    if (!remMatch) continue;
    
    const keyRem = parseFloat(remMatch[1]);
    const diff = Math.abs(keyRem - remValue);
    
    if (diff < closestDiff) {
      closestDiff = diff;
      closestKey = key;
    }
  }

  // Only return if reasonably close (within 0.25rem)
  return closestDiff <= 0.25 ? closestKey : null;
}

/**
 * Extract typography from design system
 * Enhanced to map to Tailwind's full typography scale
 */
function extractTypography(graph: StyleGraph): TailwindTypographyMapping {
  const typography: TailwindTypographyMapping = {
    fontFamily: {},
    fontSize: {},
    fontWeight: {},
    lineHeight: {},
    letterSpacing: {},
  };

  const nodes = Array.from(graph.nodes.values());
  const typographyNodes = nodes.filter(
    (n) =>
      n.type === "typography" ||
      n.name.includes("font") ||
      n.name.includes("text") ||
      n.name.includes("type")
  );

  for (const node of typographyNodes) {
    const parts = node.name.split(".");
    const lastPart = parts[parts.length - 1];
    const value =
      typeof node.value === "object"
        ? node.value.light || node.value.dark
        : node.value;

    if (!value) continue;

    // Font families - map to Tailwind's standard names
    if (parts.includes("fontFamily") || parts.includes("family")) {
      const familyMap: Record<string, string> = {
        'sans': 'sans',
        'serif': 'serif',
        'mono': 'mono',
        'monospace': 'mono',
        'system': 'sans',
      };
      
      const key = familyMap[lastPart.toLowerCase()] || lastPart;
      typography.fontFamily[key] = value;
      continue;
    }

    // Font sizes - intelligently map to Tailwind scale
    if (parts.includes("fontSize") || parts.includes("size")) {
      // Direct mapping if already uses Tailwind names
      if (TAILWIND_FONT_SIZES[lastPart]) {
        typography.fontSize[lastPart] = value;
        continue;
      }

      // Semantic mapping
      const sizeMap: Record<string, string> = {
        'xs': 'xs',
        'small': 'sm',
        'sm': 'sm',
        'base': 'base',
        'medium': 'base',
        'md': 'base',
        'large': 'lg',
        'lg': 'lg',
        'xl': 'xl',
        'xxl': '2xl',
        '2xl': '2xl',
        '3xl': '3xl',
        '4xl': '4xl',
        '5xl': '5xl',
        '6xl': '6xl',
        '7xl': '7xl',
        '8xl': '8xl',
        '9xl': '9xl',
      };

      if (sizeMap[lastPart]) {
        typography.fontSize[sizeMap[lastPart]] = value;
        continue;
      }

      // Infer from pixel/rem values
      const inferredSize = inferFontSize(value);
      if (inferredSize) {
        typography.fontSize[inferredSize] = value;
        continue;
      }

      // Fallback: use as-is
      typography.fontSize[lastPart] = value;
      continue;
    }

    // Font weights - map to Tailwind weight names
    if (parts.includes("fontWeight") || parts.includes("weight")) {
      // Normalize numeric weights to names
      const weightMap: Record<string, string> = {
        '100': 'thin',
        '200': 'extralight',
        '300': 'light',
        '400': 'normal',
        '500': 'medium',
        '600': 'semibold',
        '700': 'bold',
        '800': 'extrabold',
        '900': 'black',
        'thin': 'thin',
        'extralight': 'extralight',
        'light': 'light',
        'normal': 'normal',
        'regular': 'normal',
        'medium': 'medium',
        'semibold': 'semibold',
        'bold': 'bold',
        'extrabold': 'extrabold',
        'black': 'black',
      };

      const weightKey = value.toString().toLowerCase();
      const mappedWeight = weightMap[weightKey] || weightMap[lastPart.toLowerCase()];
      
      if (mappedWeight) {
        typography.fontWeight[mappedWeight] = TAILWIND_FONT_WEIGHTS[mappedWeight];
      } else {
        typography.fontWeight[lastPart] = value;
      }
      continue;
    }

    // Line heights
    if (parts.includes("lineHeight") || parts.includes("leading")) {
      typography.lineHeight[lastPart] = value;
      continue;
    }

    // Letter spacing
    if (parts.includes("letterSpacing") || parts.includes("tracking")) {
      typography.letterSpacing[lastPart] = value;
      continue;
    }
  }

  return typography;
}

/**
 * Infer Tailwind font size name from pixel/rem value
 */
function inferFontSize(value: string): string | null {
  // Parse px values
  const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) {
    const px = parseFloat(pxMatch[1]);
    const rem = px / 16;
    return findClosestFontSize(rem);
  }

  // Parse rem values
  const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
  if (remMatch) {
    const rem = parseFloat(remMatch[1]);
    return findClosestFontSize(rem);
  }

  return null;
}

/**
 * Find the closest Tailwind font size name for a rem value
 */
function findClosestFontSize(remValue: number): string | null {
  let closestName: string | null = null;
  let closestDiff = Infinity;

  for (const [name, value] of Object.entries(TAILWIND_FONT_SIZES)) {
    const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
    if (!remMatch) continue;
    
    const sizeRem = parseFloat(remMatch[1]);
    const diff = Math.abs(sizeRem - remValue);
    
    if (diff < closestDiff) {
      closestDiff = diff;
      closestName = name;
    }
  }

  // Only return if reasonably close (within 0.25rem)
  return closestDiff <= 0.25 ? closestName : null;
}

/**
 * Extract border radius tokens from design system
 */
function extractRadius(graph: StyleGraph): TailwindRadiusMapping {
  const radius: TailwindRadiusMapping = {};
  const nodes = Array.from(graph.nodes.values());

  // Find radius/border-radius tokens
  const radiusNodes = nodes.filter(
    (n) =>
      n.name.includes("radius") ||
      n.name.includes("corner") ||
      n.name.includes("rounded")
  );

  for (const node of radiusNodes) {
    const parts = node.name.split(".");
    const lastPart = parts[parts.length - 1];
    const value = typeof node.value === "object" ? node.value.light : node.value;
    
    if (!value) continue;

    // Direct mapping if using Tailwind names
    if (TAILWIND_RADIUS_SCALE[lastPart]) {
      radius[lastPart] = value;
      continue;
    }

    // Semantic mapping
    const radiusMap: Record<string, string> = {
      'none': 'none',
      'small': 'sm',
      'sm': 'sm',
      'medium': 'DEFAULT',
      'md': 'md',
      'default': 'DEFAULT',
      'large': 'lg',
      'lg': 'lg',
      'xl': 'xl',
      'extra-large': 'xl',
      '2xl': '2xl',
      '3xl': '3xl',
      'full': 'full',
      'circle': 'full',
      'pill': 'full',
    };

    if (radiusMap[lastPart.toLowerCase()]) {
      radius[radiusMap[lastPart.toLowerCase()]] = value;
      continue;
    }

    // Fallback: use as-is
    radius[lastPart] = value;
  }

  return radius;
}

/**
 * Extract shadow/elevation tokens from design system
 */
function extractShadows(graph: StyleGraph): TailwindShadowMapping {
  const shadows: TailwindShadowMapping = {};
  const nodes = Array.from(graph.nodes.values());

  // Find shadow/elevation tokens
  const shadowNodes = nodes.filter(
    (n) =>
      n.name.includes("shadow") ||
      n.name.includes("elevation") ||
      n.name.includes("drop-shadow") ||
      n.name.includes("boxShadow")
  );

  for (const node of shadowNodes) {
    const parts = node.name.split(".");
    const lastPart = parts[parts.length - 1];
    const value = typeof node.value === "object" ? node.value.light : node.value;
    
    if (!value) continue;

    // Direct mapping if using Tailwind names
    if (TAILWIND_SHADOW_SCALE[lastPart]) {
      shadows[lastPart] = value;
      continue;
    }

    // Semantic mapping for elevation/shadow levels
    const shadowMap: Record<string, string> = {
      'none': 'none',
      'xs': 'sm',
      'small': 'sm',
      'sm': 'sm',
      'medium': 'DEFAULT',
      'md': 'md',
      'default': 'DEFAULT',
      'large': 'lg',
      'lg': 'lg',
      'xl': 'xl',
      'extra-large': 'xl',
      '2xl': '2xl',
      'xxl': '2xl',
      'inner': 'inner',
      'inset': 'inner',
    };

    // Try semantic mapping
    if (shadowMap[lastPart.toLowerCase()]) {
      shadows[shadowMap[lastPart.toLowerCase()]] = value;
      continue;
    }

    // Try numeric elevation (e.g., elevation.1 → sm, elevation.3 → lg)
    const elevationNum = parseInt(lastPart);
    if (!isNaN(elevationNum)) {
      const elevationToShadow: Record<number, string> = {
        0: 'none',
        1: 'sm',
        2: 'DEFAULT',
        3: 'md',
        4: 'lg',
        5: 'xl',
        6: '2xl',
      };
      
      if (elevationToShadow[elevationNum]) {
        shadows[elevationToShadow[elevationNum]] = value;
        continue;
      }
    }

    // Fallback: use as-is
    shadows[lastPart] = value;
  }

  return shadows;
}

/**
 * Extract opacity, blur, and z-index tokens from design system
 */
function extractEffects(graph: StyleGraph): TailwindEffectsMapping {
  const effects: TailwindEffectsMapping = {
    opacity: {},
    blur: {},
    zIndex: {},
  };
  
  const nodes = Array.from(graph.nodes.values());

  // Extract opacity tokens
  const opacityNodes = nodes.filter(
    (n) => n.name.includes("opacity") || n.name.includes("alpha")
  );

  for (const node of opacityNodes) {
    const parts = node.name.split(".");
    const lastPart = parts[parts.length - 1];
    const value = typeof node.value === "object" ? node.value.light : node.value;
    
    if (!value) continue;

    // Parse numeric opacity (0-100 or 0-1)
    const numericMatch = value.toString().match(/^(\d+(?:\.\d+)?)(%)?$/);
    if (numericMatch) {
      let opacityValue = parseFloat(numericMatch[1]);
      
      // Convert percentage to decimal
      if (numericMatch[2] === '%') {
        opacityValue = opacityValue / 100;
      }
      
      // Find closest Tailwind opacity value
      const closestKey = findClosestOpacity(opacityValue);
      if (closestKey) {
        effects.opacity[closestKey] = opacityValue.toString();
        continue;
      }
    }

    // Direct mapping if already using Tailwind scale
    if (TAILWIND_OPACITY_SCALE[lastPart]) {
      effects.opacity[lastPart] = value;
    }
  }

  // Extract blur tokens
  const blurNodes = nodes.filter(
    (n) => n.name.includes("blur") || n.name.includes("backdrop")
  );

  for (const node of blurNodes) {
    const parts = node.name.split(".");
    const lastPart = parts[parts.length - 1];
    const value = typeof node.value === "object" ? node.value.light : node.value;
    
    if (!value) continue;

    // Direct mapping
    if (TAILWIND_BLUR_SCALE[lastPart]) {
      effects.blur[lastPart] = value;
      continue;
    }

    // Semantic mapping
    const blurMap: Record<string, string> = {
      'none': 'none',
      'sm': 'sm',
      'small': 'sm',
      'medium': 'DEFAULT',
      'md': 'md',
      'default': 'DEFAULT',
      'lg': 'lg',
      'large': 'lg',
      'xl': 'xl',
      '2xl': '2xl',
      '3xl': '3xl',
    };

    if (blurMap[lastPart.toLowerCase()]) {
      effects.blur[blurMap[lastPart.toLowerCase()]] = value;
    }
  }

  // Extract z-index tokens
  const zIndexNodes = nodes.filter(
    (n) => n.name.includes("zIndex") || n.name.includes("z-index") || n.name.includes("layer")
  );

  for (const node of zIndexNodes) {
    const parts = node.name.split(".");
    const lastPart = parts[parts.length - 1];
    const value = typeof node.value === "object" ? node.value.light : node.value;
    
    if (!value) continue;

    // Direct mapping
    if (TAILWIND_Z_INDEX_SCALE[lastPart]) {
      effects.zIndex[lastPart] = value;
      continue;
    }

    // Try to parse as number
    const numValue = parseInt(value.toString());
    if (!isNaN(numValue)) {
      // Round to nearest Tailwind z-index
      const closestZ = findClosestZIndex(numValue);
      if (closestZ) {
        effects.zIndex[closestZ] = value;
      }
    }
  }

  return effects;
}

/**
 * Find the closest Tailwind opacity value
 */
function findClosestOpacity(value: number): string | null {
  let closestKey: string | null = null;
  let closestDiff = Infinity;

  for (const [key, opacityStr] of Object.entries(TAILWIND_OPACITY_SCALE)) {
    const opacity = parseFloat(opacityStr);
    const diff = Math.abs(opacity - value);
    
    if (diff < closestDiff) {
      closestDiff = diff;
      closestKey = key;
    }
  }

  // Only return if reasonably close (within 0.1)
  return closestDiff <= 0.1 ? closestKey : null;
}

/**
 * Find the closest Tailwind z-index value
 */
function findClosestZIndex(value: number): string | null {
  if (value === 0) return '0';
  if (value < 0) return null; // Tailwind doesn't support negative z-index in scale
  
  // Round to nearest 10
  const rounded = Math.round(value / 10) * 10;
  if (rounded >= 0 && rounded <= 50) {
    return rounded.toString();
  }
  
  return null;
}

/**
 * Merge color scales into flat structure
 */
function mergeColorScales(
  colors: TailwindColorMapping
): Record<string, { light?: string; dark?: string }> {
  const merged: Record<string, { light?: string; dark?: string }> = {};

  for (const [name, config] of Object.entries(colors)) {
    if (config.light || config.dark) {
      merged[name] = { light: config.light, dark: config.dark };
    }

    if (config.scales) {
      for (const [scale, value] of Object.entries(config.scales)) {
        merged[`${name}-${scale}`] = value;
      }
    }
  }

  return merged;
}

/**
 * Generate Tailwind v4 CSS configuration
 * Enhanced version with comprehensive token mapping
 */
export function generateTailwindV4Config(graph: StyleGraph): string {
  const colors = extractColorScales(graph);
  const spacing = extractSpacing(graph);
  const typography = extractTypography(graph);
  const radius = extractRadius(graph);
  const shadows = extractShadows(graph);
  const effects = extractEffects(graph);

  const mergedColors = mergeColorScales(colors);

  // Generate statistics for header comment
  const stats = {
    colors: Object.keys(mergedColors).length,
    darkColors: Object.entries(mergedColors).filter(([_, v]) => v.dark).length,
    spacing: Object.keys(spacing).length,
    fontFamilies: Object.keys(typography.fontFamily).length,
    fontSizes: Object.keys(typography.fontSize).length,
    fontWeights: Object.keys(typography.fontWeight).length,
    radius: Object.keys(radius).length,
    shadows: Object.keys(shadows).length,
    opacity: Object.keys(effects.opacity).length,
    blur: Object.keys(effects.blur).length,
    zIndex: Object.keys(effects.zIndex).length,
    totalTokens: Object.keys(mergedColors).length + 
                 Object.keys(spacing).length + 
                 Object.keys(typography.fontSize).length +
                 Object.keys(radius).length +
                 Object.keys(shadows).length +
                 Object.keys(effects.opacity).length +
                 Object.keys(effects.blur).length +
                 Object.keys(effects.zIndex).length,
  };

  let css = `/**
 * Tailwind v4 Theme Configuration
 * Auto-generated from Design Language Agent
 * 
 * This CSS file remaps Tailwind's default theme to your design system tokens.
 * Import this file in your main CSS after @import "tailwindcss";
 * 
 * Statistics:
 *   - ${stats.colors} colors (${stats.darkColors} with dark mode variants)
 *   - ${stats.spacing} spacing values
 *   - ${stats.fontSizes} font sizes
 *   - ${stats.fontWeights} font weights
 *   - ${stats.radius} border radius values
 *   - ${stats.shadows} shadows/elevations
 *   - ${stats.opacity} opacity values
 *   - ${stats.blur} blur values
 *   - ${stats.zIndex} z-index values
 *   - ${stats.totalTokens} total mapped tokens
 * 
 * Usage: All standard Tailwind classes now use your design system!
 */

@theme {
  /* ===================================
   * Colors
   * =================================== */
`;

  // Generate color variables for light mode
  css += "\n  /* Light Mode Colors */\n";
  for (const [name, values] of Object.entries(mergedColors)) {
    if (values.light) {
      css += `  --color-${name}: ${values.light};\n`;
    }
  }

  // Generate spacing variables
  if (Object.keys(spacing).length > 0) {
    css +=
      "\n  /* ===================================\n   * Spacing Scale\n   * =================================== */\n\n";
    // Sort spacing keys numerically for better readability
    const sortedSpacing = Object.entries(spacing).sort((a, b) => {
      const aNum = parseFloat(a[0]);
      const bNum = parseFloat(b[0]);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a[0].localeCompare(b[0]);
    });
    for (const [key, value] of sortedSpacing) {
      css += `  --spacing-${key}: ${value};\n`;
    }
  }

  // Generate border radius
  if (Object.keys(radius).length > 0) {
    css +=
      "\n  /* ===================================\n   * Border Radius\n   * =================================== */\n\n";
    for (const [key, value] of Object.entries(radius)) {
      const varName = key === 'DEFAULT' ? '--radius' : `--radius-${key}`;
      css += `  ${varName}: ${value};\n`;
    }
  }

  // Generate typography variables
  if (Object.keys(typography.fontFamily).length > 0) {
    css +=
      "\n  /* ===================================\n   * Typography - Font Families\n   * =================================== */\n\n";
    for (const [key, value] of Object.entries(typography.fontFamily)) {
      css += `  --font-family-${key}: ${value};\n`;
    }
  }

  if (Object.keys(typography.fontSize).length > 0) {
    css += "\n  /* Typography - Font Sizes */\n";
    // Sort font sizes for readability
    const sizeOrder = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
    const sortedSizes = Object.entries(typography.fontSize).sort((a, b) => {
      const aIdx = sizeOrder.indexOf(a[0]);
      const bIdx = sizeOrder.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      return a[0].localeCompare(b[0]);
    });
    for (const [key, value] of sortedSizes) {
      css += `  --font-size-${key}: ${value};\n`;
    }
  }

  if (Object.keys(typography.fontWeight).length > 0) {
    css += "\n  /* Typography - Font Weights */\n";
    // Sort font weights by numeric value
    const sortedWeights = Object.entries(typography.fontWeight).sort((a, b) => {
      const aNum = parseInt(a[1]);
      const bNum = parseInt(b[1]);
      return aNum - bNum;
    });
    for (const [key, value] of sortedWeights) {
      css += `  --font-weight-${key}: ${value};\n`;
    }
  }

  if (Object.keys(typography.lineHeight).length > 0) {
    css += "\n  /* Typography - Line Heights */\n";
    for (const [key, value] of Object.entries(typography.lineHeight)) {
      css += `  --line-height-${key}: ${value};\n`;
    }
  }

  if (Object.keys(typography.letterSpacing).length > 0) {
    css += "\n  /* Typography - Letter Spacing */\n";
    for (const [key, value] of Object.entries(typography.letterSpacing)) {
      css += `  --letter-spacing-${key}: ${value};\n`;
    }
  }

  // Generate shadow variables
  if (Object.keys(shadows).length > 0) {
    css +=
      "\n  /* ===================================\n   * Shadows & Elevation\n   * =================================== */\n\n";
    // Sort shadows for readability
    const shadowOrder = ['none', 'sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl', 'inner'];
    const sortedShadows = Object.entries(shadows).sort((a, b) => {
      const aIdx = shadowOrder.indexOf(a[0]);
      const bIdx = shadowOrder.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      return a[0].localeCompare(b[0]);
    });
    for (const [key, value] of sortedShadows) {
      const varName = key === 'DEFAULT' ? '--shadow' : `--shadow-${key}`;
      css += `  ${varName}: ${value};\n`;
    }
  }

  // Generate opacity variables
  if (Object.keys(effects.opacity).length > 0) {
    css +=
      "\n  /* ===================================\n   * Opacity\n   * =================================== */\n\n";
    // Sort opacity numerically
    const sortedOpacity = Object.entries(effects.opacity).sort((a, b) => {
      const aNum = parseInt(a[0]);
      const bNum = parseInt(b[0]);
      return aNum - bNum;
    });
    for (const [key, value] of sortedOpacity) {
      css += `  --opacity-${key}: ${value};\n`;
    }
  }

  // Generate blur variables
  if (Object.keys(effects.blur).length > 0) {
    css +=
      "\n  /* ===================================\n   * Blur\n   * =================================== */\n\n";
    const blurOrder = ['none', 'sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl', '3xl'];
    const sortedBlur = Object.entries(effects.blur).sort((a, b) => {
      const aIdx = blurOrder.indexOf(a[0]);
      const bIdx = blurOrder.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      return a[0].localeCompare(b[0]);
    });
    for (const [key, value] of sortedBlur) {
      const varName = key === 'DEFAULT' ? '--blur' : `--blur-${key}`;
      css += `  ${varName}: ${value};\n`;
    }
  }

  // Generate z-index variables
  if (Object.keys(effects.zIndex).length > 0) {
    css +=
      "\n  /* ===================================\n   * Z-Index\n   * =================================== */\n\n";
    // Sort z-index numerically
    const sortedZIndex = Object.entries(effects.zIndex).sort((a, b) => {
      if (a[0] === 'auto') return 1;
      if (b[0] === 'auto') return -1;
      const aNum = parseInt(a[0]);
      const bNum = parseInt(b[0]);
      return aNum - bNum;
    });
    for (const [key, value] of sortedZIndex) {
      css += `  --z-${key}: ${value};\n`;
    }
  }

  css += "}\n";

  // Dark mode overrides
  const darkColors = Object.entries(mergedColors).filter(([_, v]) => v.dark);
  if (darkColors.length > 0) {
    css += `
@theme dark {
  /* ===================================
   * Dark Mode Color Overrides
   * =================================== */
\n`;
    for (const [name, values] of darkColors) {
      if (values.dark) {
        css += `  --color-${name}: ${values.dark};\n`;
      }
    }
    css += "}\n";
  }

  // Add comprehensive usage examples in comments
  css += `
/* ===================================
 * Usage Examples - Standard Tailwind Classes
 * ===================================
 * 
 * All these classes now use YOUR design system tokens!
 * 
 * Colors:
 *   <div class="bg-primary text-foreground border-border">
 *   <button class="bg-blue-500 hover:bg-blue-600">
 *   <div class="text-red-500 bg-slate-100">
 * 
 * Spacing (padding, margin, gap, etc.):
 *   <div class="p-4 m-2 gap-4">
 *   <div class="px-8 py-2">
 *   <div class="space-y-4 space-x-2">
 * 
 * Typography:
 *   <h1 class="font-sans text-4xl font-bold">
 *   <p class="text-base font-normal leading-relaxed">
 * 
 * Border Radius:
 *   <div class="rounded-lg">
 *   <button class="rounded-full">
 * 
 * Shadows & Elevation:
 *   <div class="shadow-lg">
 *   <div class="shadow-sm hover:shadow-xl transition-shadow">
 *   <div class="shadow-inner">
 * 
 * Opacity:
 *   <div class="opacity-50">
 *   <div class="bg-primary/20">
 *   <div class="hover:opacity-100">
 * 
 * Blur & Backdrop:
 *   <div class="blur-sm">
 *   <div class="backdrop-blur-md">
 *   <div class="backdrop-blur-lg bg-white/30">
 * 
 * Z-Index & Layering:
 *   <div class="z-10">
 *   <div class="z-50 relative">
 *   <div class="z-0">
 * 
 * Complete Card Example:
 *   <div class="
 *     bg-card text-card-foreground
 *     p-6 rounded-lg
 *     shadow-lg hover:shadow-2xl
 *     border border-border
 *     transition-all duration-300
 *   ">
 *     <h3 class="text-xl font-bold mb-2">Card Title</h3>
 *     <p class="text-muted-foreground">Card content</p>
 *   </div>
 * 
 * Complete Button Example:
 *   <button class="
 *     bg-primary text-primary-foreground
 *     px-4 py-2
 *     rounded-lg
 *     font-semibold text-sm
 *     shadow-md hover:shadow-lg
 *     hover:bg-primary/90
 *     focus:ring-2 focus:ring-ring focus:ring-offset-2
 *     transition-all duration-200
 *   ">
 *     Click Me
 *   </button>
 * 
 * Modal Overlay Example:
 *   <div class="
 *     fixed inset-0 z-50
 *     bg-black/50
 *     backdrop-blur-sm
 *   ">
 *     <div class="
 *       bg-background
 *       rounded-xl
 *       shadow-2xl
 *       p-8
 *       max-w-lg mx-auto mt-20
 *     ">
 *       Modal content
 *     </div>
 *   </div>
 * 
 * The magic: These are standard Tailwind classes, but they
 * automatically use your design system values. No prop drilling,
 * no theme context - just write normal Tailwind!
 */
`;

  return css;
}

/**
 * Generate Tailwind CSS with direct token mapping
 * This creates utility classes that directly use design tokens
 */
export function generateTailwindWithTokens(graph: StyleGraph): string {
  const nodes = Array.from(graph.nodes.values());

  let css = `/**
 * Tailwind Utilities with Design System Tokens
 * Auto-generated from Design Language Agent
 * 
 * These utilities let you use design tokens directly with Tailwind syntax.
 */

@layer utilities {
`;

  // Generate color utilities
  const colorNodes = nodes.filter((n) => n.type === "color");
  for (const node of colorNodes) {
    const tokenName = node.name.replace(/\./g, "-");

    const lightValue =
      typeof node.value === "object" ? node.value.light : node.value;
    if (lightValue) {
      css += `  .text-token-${tokenName} { color: ${lightValue}; }\n`;
      css += `  .bg-token-${tokenName} { background-color: ${lightValue}; }\n`;
      css += `  .border-token-${tokenName} { border-color: ${lightValue}; }\n`;
    }
  }

  css += "}\n";

  // Dark mode
  const darkColorNodes = colorNodes.filter((n) => {
    const darkValue = typeof n.value === "object" ? n.value.dark : undefined;
    return darkValue !== undefined;
  });

  if (darkColorNodes.length > 0) {
    css += `
@layer utilities {
  @media (prefers-color-scheme: dark) {
`;
    for (const node of darkColorNodes) {
      const tokenName = node.name.replace(/\./g, "-");
      const darkValue =
        typeof node.value === "object" ? node.value.dark : undefined;

      if (darkValue) {
        css += `    .text-token-${tokenName} { color: ${darkValue}; }\n`;
        css += `    .bg-token-${tokenName} { background-color: ${darkValue}; }\n`;
        css += `    .border-token-${tokenName} { border-color: ${darkValue}; }\n`;
      }
    }
    css += "  }\n}\n";
  }

  return css;
}

/**
 * Generate comprehensive Tailwind export package
 */
export interface TailwindExportResult {
  themeConfig: string;
  tokenUtilities: string;
  readme: string;
}

export function generateTailwindExport(
  graph: StyleGraph
): TailwindExportResult {
  const themeConfig = generateTailwindV4Config(graph);
  const tokenUtilities = generateTailwindWithTokens(graph);

  const readme = `# Design System - Tailwind Configuration

This package contains Tailwind v4 configuration generated from your design system.

## Files

- \`theme.css\` - Remaps Tailwind's default theme to your design tokens
- \`tokens.css\` - Direct token utilities (e.g., \`.text-token-primary\`)

## Installation

### Option 1: Use Remapped Theme (Recommended)

This makes Tailwind's standard classes use your design system:

\`\`\`css
/* app.css */
@import "tailwindcss";
@import "./theme.css";
\`\`\`

Now use standard Tailwind classes:
\`\`\`html
<div class="bg-primary text-foreground p-4">
  <h1 class="text-2xl font-bold">Hello</h1>
</div>
\`\`\`

### Option 2: Direct Token Utilities

For explicit token usage:

\`\`\`css
/* app.css */
@import "tailwindcss";
@import "./tokens.css";
\`\`\`

Use token-specific classes:
\`\`\`html
<div class="bg-token-semantic-color-background-app">
  <p class="text-token-semantic-color-text-primary">Text</p>
</div>
\`\`\`

### Option 3: Use Both

Import both files to get standard Tailwind classes + token utilities:

\`\`\`css
@import "tailwindcss";
@import "./theme.css";
@import "./tokens.css";
\`\`\`

## Dark Mode

Dark mode is automatically handled through:
- \`@theme dark\` for remapped classes
- \`@media (prefers-color-scheme: dark)\` for token utilities

## Updating

Re-export from Design Language Agent whenever your design system changes.
`;

  return {
    themeConfig,
    tokenUtilities,
    readme,
  };
}
