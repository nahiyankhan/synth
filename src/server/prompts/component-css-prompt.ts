/**
 * Component CSS Generation Prompts
 *
 * Used in Phase 5 of design language generation to produce
 * CSS for x-* component classes based on visual direction.
 */

import { getClassInventoryForPrompt } from "../../lib/json-render/component-classes";

export const COMPONENT_CSS_SYSTEM_PROMPT = `
You are generating component CSS for a design system.

Your output will be combined with a theme that defines CSS custom properties.
Use var(--token-name) for ALL visual values. Output PLAIN CSS only - no @apply, no Tailwind utilities.

## Design Tokens Available

All tokens are pre-generated. **USE THESE TOKENS** - do not hardcode values.

### Color Tokens (Semantic) - Primary choices for components
- var(--color-background): Main background
- var(--color-foreground): Main text
- var(--color-muted): Subtle background
- var(--color-muted-foreground): Subtle text
- var(--color-border): Borders, dividers
- var(--color-primary): Primary actions
- var(--color-primary-foreground): Text on primary
- var(--color-secondary): Secondary elements
- var(--color-secondary-foreground): Text on secondary
- var(--color-destructive): Danger/error
- var(--color-destructive-foreground): Text on destructive
- var(--color-accent): Accent/highlight
- var(--color-accent-foreground): Text on accent

### Status Colors
- var(--color-success), var(--color-success-foreground)
- var(--color-warning), var(--color-warning-foreground)
- var(--color-info), var(--color-info-foreground)

### Palette Scales (for fine-tuning)
- var(--color-gray-50) through var(--color-gray-950)
- var(--color-{palette}-50) through var(--color-{palette}-950)

### Radius Tokens
- var(--radius-selector): Buttons, tabs (small interactive)
- var(--radius-field): Form inputs
- var(--radius-box): Cards, containers
- var(--radius-full): Pills, avatars (9999px)

### Shadow Tokens
- var(--shadow-xs): Subtle lift
- var(--shadow-sm): Light elevation
- var(--shadow-md): Medium (cards)
- var(--shadow-lg): High (dropdowns)
- var(--shadow-xl): Maximum (modals)

### Typography Tokens
- var(--font-size-xs), var(--font-size-sm), var(--font-size-base), var(--font-size-lg)
- var(--font-size-xl), var(--font-size-2xl), var(--font-size-3xl), var(--font-size-4xl)
- var(--line-height-tight): 1.2 (headings)
- var(--line-height-normal): 1.5 (body)
- var(--line-height-relaxed): 1.75 (loose)

### Motion Tokens
- var(--duration-fast): 150ms
- var(--duration-normal): 250ms
- var(--duration-slow): 400ms
- var(--ease-default), var(--ease-in), var(--ease-out)

## Critical Rules

1. **PLAIN CSS ONLY** - No @apply, no Tailwind utilities
2. **USE TOKENS** - Never hardcode colors, radius, shadows, or transitions
3. **Include states** - :hover, :focus, :active for interactive elements
4. **Pair colors** - backgrounds with matching foreground tokens

## Examples

\`\`\`css
/* CORRECT - plain CSS with tokens */
.x-card {
  background: var(--color-background);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  box-shadow: var(--shadow-md);
  padding: 1.25rem;
}

.x-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: var(--font-size-sm);
  font-weight: 500;
  border-radius: var(--radius-selector);
  transition: all var(--duration-fast) var(--ease-default);
  cursor: pointer;
  border: none;
}

.x-btn:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.x-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.x-btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.x-btn-primary:hover {
  filter: brightness(1.1);
}

.x-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 0.75rem;
  font-size: var(--font-size-sm);
  background: var(--color-background);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-field);
  transition: border-color var(--duration-fast) var(--ease-default);
}

.x-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary) / 0.2;
}

/* WRONG - using @apply or Tailwind utilities */
.x-card {
  @apply bg-background p-5;  /* NO! */
}
\`\`\`

## Output Format

Output valid CSS only. No markdown code fences, no explanations.
`;

export interface FoundationTokensForPrompt {
  radius: {
    selector: string;
    field: string;
    box: string;
  };
  shadow: {
    style: string; // "none" | "subtle" | "medium" | "dramatic"
  };
  typography: {
    scaleRatio: string; // "majorSecond" | "minorThird" | etc.
  };
  palettes?: {
    primary: string;     // e.g., "blue", "violet", "teal"
  };
}

export function buildComponentCSSUserPrompt(
  visualDirection: {
    name: string;
    traits: string[];
    aestheticPreferences: string[];
    designPrinciples: string[];
    emotionalResonance: string[];
  },
  foundationTokens?: FoundationTokensForPrompt
): string {
  const paletteContext = foundationTokens?.palettes ? `
**Brand Color:** ${foundationTokens.palettes.primary} (e.g., bg-${foundationTokens.palettes.primary}-500 for brand moments)
` : '';

  const foundationContext = foundationTokens ? `
## Foundation Tokens (Brand-Specific Values)

These are the actual values generated for this brand. Use them consistently.

**Radius:**
- --radius-selector: ${foundationTokens.radius.selector} (buttons, tabs)
- --radius-field: ${foundationTokens.radius.field} (inputs)
- --radius-box: ${foundationTokens.radius.box} (cards, containers)

**Shadow Style:** ${foundationTokens.shadow.style}
${foundationTokens.shadow.style === 'none' ? '- This brand uses flat design. Avoid shadows except for focus states.' :
  foundationTokens.shadow.style === 'subtle' ? '- Use --shadow-sm and --shadow-md sparingly for depth.' :
  foundationTokens.shadow.style === 'dramatic' ? '- Use --shadow-md and --shadow-lg generously for bold depth.' :
  '- Use shadows moderately for balanced depth.'}

**Typography Scale:** ${foundationTokens.typography.scaleRatio}
${foundationTokens.typography.scaleRatio === 'majorSecond' ? '- Subtle scale (1.125) - keep sizes close together for dense UI.' :
  foundationTokens.typography.scaleRatio === 'goldenRatio' ? '- Dramatic scale (1.618) - use large size contrasts for impact.' :
  '- Balanced scale - standard size progression.'}
${paletteContext}` : '';

  return `
## Brand Context

Name: ${visualDirection.name}
Traits: ${visualDirection.traits.join(", ")}
Aesthetic: ${visualDirection.aestheticPreferences.join(", ")}
Principles: ${visualDirection.designPrinciples.join(", ")}
Emotional Resonance: ${visualDirection.emotionalResonance.join(", ")}
${foundationContext}
## Component Classes to Define

Generate CSS for ALL classes below. Express the brand through every choice.
USE THE DESIGN TOKENS - do not hardcode border-radius, box-shadow, or transition values.

${getClassInventoryForPrompt()}

## Requirements

1. Define styles for EVERY class listed above
2. Use var(--token) syntax for ALL colors, radius, shadows, transitions
3. Include :hover, :focus, :active states for interactive elements
4. PLAIN CSS ONLY - absolutely no @apply or Tailwind utilities
5. Be consistent - similar components should feel related
6. Output CSS only - no markdown, no explanations
`;
}
