/**
 * json-render Component System
 *
 * This module contains components for AI-GENERATED UIs, NOT for the app itself.
 *
 * ARCHITECTURE SEPARATION:
 * ========================
 *
 * 1. APP UI COMPONENTS (src/components/ui/)
 *    - shadcn/ui components for this application's interface
 *    - Used by: Pages, Toolbars, Panels, etc.
 *    - Styling: Tailwind classes
 *    - NOT themed by design language generation
 *
 * 2. JSON-RENDER COMPONENTS (this folder)
 *    - Components rendered from AI-generated JSON specs
 *    - Used by: PlaygroundPage preview, AI generation pipeline
 *    - Styling: CSS variables (--foreground, --background, etc.)
 *    - THEMED by design language generation
 *
 * When a design language is generated, it produces CSS that defines
 * variables like --color-primary, --color-background, etc. These
 * json-render components use those variables, so they automatically
 * adopt the generated design language's look and feel.
 *
 * The app UI (shadcn) uses a fixed theme defined in src/index.css.
 *
 * @example
 * ```tsx
 * import { componentRegistry, catalog } from '@/lib/json-render';
 *
 * // Render AI-generated UI
 * <DataProvider data={data}>
 *   <Renderer
 *     spec={aiGeneratedSpec}
 *     registry={componentRegistry}
 *   />
 * </DataProvider>
 * ```
 */

export {
  componentRegistry,
  FallbackComponent,
  useInteractiveState,
  getCustomClass,
} from './components';

export {
  catalog,
  catalogPrompt,
  componentCategories,
  componentList,
} from './catalog';

export type { UICatalog } from './catalog';
