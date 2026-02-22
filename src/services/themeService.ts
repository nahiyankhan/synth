/**
 * Theme Service
 *
 * Manages design language application by injecting Tailwind v4 CSS.
 * Uses standard Tailwind/shadcn CSS variable naming.
 *
 * Injects two types of CSS:
 * 1. Theme CSS: Color tokens, typography, spacing (--color-primary, etc.)
 * 2. Component CSS: x-* class definitions for json-render components
 */

import {
  loadDesignLanguageMetadata,
  getAllDesignLanguages,
} from './designLanguageDB';
import type { ColorSystemOutput } from '@/server/transformers/tailwind-color-system';

let currentLanguageId: string | null = null;

// =============================================================================
// Design Language CSS Application
// =============================================================================

/**
 * Apply full design language CSS (theme + component styles)
 *
 * This is the primary method for applying a complete design language.
 * Injects a single <style> element containing:
 * - Theme tokens (colors, typography, spacing)
 * - Component CSS (x-* class definitions)
 */
export function applyDesignLanguageCSS(css: string): void {
  // Remove any existing design language style element
  const existingStyle = document.getElementById('design-language-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new style element
  const styleEl = document.createElement('style');
  styleEl.id = 'design-language-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  console.log('✅ Design language CSS applied:', {
    length: css.length,
  });
}

/**
 * Remove design language CSS (reset to defaults)
 */
export function removeDesignLanguageCSS(): void {
  const styleEl = document.getElementById('design-language-styles');
  if (styleEl) {
    styleEl.remove();
    console.log('✅ Design language CSS removed');
  }
}

// =============================================================================
// Legacy: Tailwind v4 Theme Application (for backwards compatibility)
// =============================================================================

/**
 * Apply a Tailwind v4 color system CSS to the document
 *
 * @deprecated Use applyDesignLanguageCSS for full theme + component CSS
 *
 * This injects the generated CSS as a <style> element, providing:
 * - @theme block with all palette scales (--color-gray-500, etc.)
 * - @theme dark block for dark mode variants
 * - Semantic tokens (--color-background, --color-primary, etc.)
 */
export function applyTailwindColorSystem(colorSystem: ColorSystemOutput): void {
  // Remove any existing Tailwind theme style element
  const existingStyle = document.getElementById('tailwind-design-language');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new style element
  const styleEl = document.createElement('style');
  styleEl.id = 'tailwind-design-language';
  styleEl.textContent = colorSystem.css;
  document.head.appendChild(styleEl);

  console.log('✅ Tailwind color system applied:', {
    paletteCount: colorSystem.summary.paletteCount,
    paletteNames: colorSystem.summary.paletteNames,
  });
}

/**
 * Remove Tailwind color system (reset to defaults)
 * @deprecated Use removeDesignLanguageCSS instead
 */
export function removeTailwindColorSystem(): void {
  const styleEl = document.getElementById('tailwind-design-language');
  if (styleEl) {
    styleEl.remove();
    console.log('✅ Tailwind color system removed');
  }
}

// =============================================================================
// Design Language Switching
// =============================================================================

/**
 * Load and apply a design language from IndexedDB
 *
 * Looks for CSS in this order:
 * 1. fullCSS (theme + component CSS combined)
 * 2. tailwindCSS (legacy: theme only)
 */
export async function switchDesignLanguage(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const metadata = await loadDesignLanguageMetadata(id);

    if (!metadata) {
      return { success: false, error: `Design language ${id} not found` };
    }

    // Try fullCSS first (new format with component CSS)
    const fullCSS = metadata.generationMetadata?.fullCSS;
    if (fullCSS) {
      // Remove legacy style element if exists
      removeTailwindColorSystem();

      // Apply the combined CSS
      applyDesignLanguageCSS(fullCSS);

      currentLanguageId = id;

      // Dispatch event for UI updates
      window.dispatchEvent(
        new CustomEvent('design-language-changed', {
          detail: { id, name: metadata.name },
        })
      );

      return { success: true };
    }

    // Fallback to tailwindCSS (legacy format)
    const tailwindCSS = metadata.generationMetadata?.tailwindCSS;

    if (!tailwindCSS) {
      return {
        success: false,
        error: `Design language ${id} has no CSS (may be legacy format)`,
      };
    }

    // Apply the CSS (legacy path)
    const colorSystemMeta = metadata.generationMetadata?.tailwindColorSystem;
    applyTailwindColorSystem({
      css: tailwindCSS,
      summary: {
        paletteCount: colorSystemMeta?.paletteNames?.length || 0,
        paletteNames: colorSystemMeta?.paletteNames || [],
        overlaps: colorSystemMeta?.overlaps || [],
        roleMapping: colorSystemMeta?.roleMapping,
      },
    } as ColorSystemOutput);

    currentLanguageId = id;

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent('design-language-changed', {
        detail: { id, name: metadata.name },
      })
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to switch design language:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get list of available design languages for selector
 */
export async function getAvailableLanguages(): Promise<
  Array<{ id: string; name: string; hasSeeds: boolean }>
> {
  const languages = await getAllDesignLanguages();

  return languages.map((lang) => ({
    id: lang.id,
    name: lang.name,
    hasSeeds: !!lang.generationMetadata?.tailwindCSS,
  }));
}

/**
 * Get currently active language ID
 */
export function getCurrentLanguageId(): string | null {
  return currentLanguageId;
}

/**
 * Reset to default theme (clears injected CSS)
 */
export function resetToDefaultTheme(): void {
  removeDesignLanguageCSS();
  removeTailwindColorSystem(); // Also remove legacy style element
  currentLanguageId = null;

  window.dispatchEvent(
    new CustomEvent('design-language-changed', {
      detail: { id: null, name: 'Default Theme' },
    })
  );
}
