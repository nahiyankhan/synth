# Refactoring Plan

**Generated:** 2026-02-07
**Branch:** feature/color-visualizations
**Based on:** Modular code audits of generation pipeline, UI components, and color visualizations

---

## Executive Summary

| Area | Modularity | DRY | Reusability | Priority |
|------|------------|-----|-------------|----------|
| Generation Pipeline | 7/10 | 6/10 | 7/10 | Medium |
| Generation UI | 5/10 | 4/10 | 6/10 | High |
| Color Visualizations | 6/10 | 5/10 | 5/10 | High |

**Total estimated debt:** ~1,200 lines of duplicated/redundant code
**Total refactoring effort:** ~16-20 hours

---

## Phase 1: Quick Wins (4 hours)

High impact, low effort changes that can be done immediately.

### 1.1 Consolidate TAILWIND_STEPS (30 min)

**Files to update:**
- `src/server/validators/contrast-validator.ts` (3 inline definitions)
- `src/server/orchestrator/design-orchestrator.ts` (1 inline definition)

**Action:** Import from `src/types/tailwindPalette.ts` instead of defining inline.

```typescript
// Replace inline arrays with:
import { TAILWIND_STEPS } from '../../types/tailwindPalette';
```

---

### 1.2 Extract `toKebabCase` utility (15 min)

**Files affected:**
- `src/server/transformers/tailwind-css-generator.ts`
- `src/server/validators/contrast-validator.ts`

**Action:** Create shared utility:

```typescript
// src/lib/utils/string-utils.ts
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
```

---

### 1.3 Extract `shortenTokenName` utility (30 min)

**Files affected:**
- `src/components/color/ColorForceGraphView.tsx`
- `src/components/color/DerivationTreeView.tsx`
- `src/components/color/ContrastMatrixView.tsx`
- `src/components/color/LightDarkCompareView.tsx`
- `src/components/color/ScaleStripView.tsx`

**Action:** Create shared utility:

```typescript
// src/components/color/utils/tokenNameUtils.ts
export function shortenTokenName(name: string, segments: number = 2): string {
  return name
    .replace(/^semantic\.color\./i, "")
    .replace(/^colors?\./i, "")
    .split(".")
    .slice(-segments)
    .join(".");
}
```

---

### 1.4 Add `getAccessibleTextColor` to colorScience (20 min)

**Files affected:**
- `src/components/color/ColorForceGraphView.tsx`
- `src/components/color/DerivationTreeView.tsx`
- `src/components/color/LightDarkCompareView.tsx`
- `src/components/color/ScaleStripView.tsx`

**Action:** Add to `src/services/colorScience.ts`:

```typescript
export function getAccessibleTextColor(
  backgroundHex: string,
  darkColor: string = "#000000",
  lightColor: string = "#ffffff",
  threshold: number = 0.6
): string {
  try {
    const oklch = hexToOKLCH(backgroundHex);
    return oklch.l > threshold ? darkColor : lightColor;
  } catch {
    return darkColor;
  }
}
```

---

### 1.5 Extract `CloseButton` component (15 min)

**Files affected:** All 6 color visualization components

**Action:** Create:

```typescript
// src/components/color/shared/CloseButton.tsx
interface CloseButtonProps {
  onClick: () => void;
  variant?: "light" | "dark";
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onClick, variant = "light" }) => (
  <button
    onClick={onClick}
    className={`p-1 rounded transition-colors ${
      variant === "light" ? "hover:bg-dark-100 text-dark-400" : "hover:bg-dark-700 text-dark-400"
    }`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);
```

---

### 1.6 Extract `FilterBanner` component (30 min)

**Files affected:** All 6 color visualization components

**Action:** Create:

```typescript
// src/components/color/shared/FilterBanner.tsx
interface FilterBannerProps {
  count: number;
  label?: string;
  onClear?: () => void;
}

export const FilterBanner: React.FC<FilterBannerProps> = ({ count, label = "colors", onClear }) => (
  <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
    <span className="text-sm text-blue-700">Filtered to {count} {label}</span>
    {onClear && (
      <button onClick={onClear} className="text-sm text-blue-600 hover:text-blue-800 underline">
        Clear filter
      </button>
    )}
  </div>
);
```

---

### 1.7 Create `SectionHeader` component (30 min)

**Files affected:**
- `src/components/GenerationFlowChart.tsx` (10 instances)
- `src/components/design-language/*.tsx` (15+ instances)

**Action:** Create:

```typescript
// src/components/ui/SectionHeader.tsx
interface SectionHeaderProps {
  children: React.ReactNode;
  as?: "h4" | "div";
  spacing?: "sm" | "md";
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  as: Component = "h4",
  spacing = "md",
}) => (
  <Component className={`text-xs font-semibold text-dark-400 uppercase tracking-wide ${
    spacing === "sm" ? "mb-1" : "mb-2"
  }`}>
    {children}
  </Component>
);
```

---

## Phase 2: Strategic Improvements (8 hours)

Higher effort changes with significant impact on maintainability.

### 2.1 Create shared phase configuration (2 hours)

**Problem:** Phase info duplicated in 3 locations with inconsistent naming.

**Action:** Create single source of truth:

```typescript
// src/constants/generationPhases.ts
export const GENERATION_PHASES = [
  {
    key: "visual-direction",
    previewKey: "visualDirection",
    label: "Direction",
    stepNumber: 1,
    loadingMessage: "Developing visual direction...",
    title: "Visual Direction",
  },
  // ... all 8 phases
] as const;

export type PhaseKey = typeof GENERATION_PHASES[number]["key"];
export const PHASE_BY_STEP = new Map(GENERATION_PHASES.map(p => [p.stepNumber, p]));
```

**Files to update:**
- `src/components/GenerationFlowChart.tsx`
- `src/hooks/useDesignGeneration.ts`

---

### 2.2 Extract `OKLCHDisplay` component (30 min)

**Files affected:**
- `src/components/color/DerivationTreeView.tsx`
- `src/components/color/LightDarkCompareView.tsx`
- `src/components/color/OKLCHSpaceView.tsx`
- `src/components/color/ScaleStripView.tsx`

**Action:** Create:

```typescript
// src/components/color/shared/OKLCHDisplay.tsx
interface OKLCHDisplayProps {
  oklch: OKLCHColor;
  variant?: "light" | "dark";
}

export const OKLCHDisplay: React.FC<OKLCHDisplayProps> = ({ oklch, variant = "light" }) => {
  const bg = variant === "light" ? "bg-dark-50" : "bg-dark-700";

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { value: `${(oklch.l * 100).toFixed(0)}%`, label: "L" },
        { value: oklch.c.toFixed(3), label: "C" },
        { value: `${oklch.h.toFixed(0)}°`, label: "H" },
      ].map(({ value, label }) => (
        <div key={label} className={`${bg} rounded-lg p-2`}>
          <div className="text-lg font-semibold">{value}</div>
          <div className="text-xs text-dark-400">{label}</div>
        </div>
      ))}
    </div>
  );
};
```

---

### 2.3 Create `useResolvedColors` hook (1.5 hours)

**Problem:** Each visualization component duplicates color extraction logic.

**Action:** Create shared hook:

```typescript
// src/components/color/hooks/useResolvedColors.ts
export interface ResolvedColorNode {
  node: StyleNode;
  hex: string;
  oklch: OKLCHColor;
  isRoot: boolean;
}

export function useResolvedColors(
  graph: StyleGraph,
  viewMode: "light" | "dark",
  filteredNodes?: StyleNode[] | null
): ResolvedColorNode[] {
  return useMemo(() => {
    const nodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
    return nodes
      .filter((n) => n.type === "color")
      .map((node) => {
        const resolved = graph.resolveNode(node.id, viewMode);
        if (!resolved || typeof resolved !== "string") return null;
        try {
          return {
            node,
            hex: resolved,
            oklch: hexToOKLCH(resolved),
            isRoot: node.dependencies.size === 0,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ResolvedColorNode[];
  }, [graph, viewMode, filteredNodes]);
}
```

**Files to update:** All 6 color visualization components

---

### 2.4 Extract `ColorDetailPanel` wrapper (2 hours)

**Problem:** Detail panel pattern repeated in all 6 files (~600 lines total).

**Action:** Create composable wrapper:

```typescript
// src/components/color/shared/ColorDetailPanel.tsx
interface ColorDetailPanelProps {
  hex: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  previewHeight?: number;
  width?: string;
  children: React.ReactNode;
}

export const ColorDetailPanel: React.FC<ColorDetailPanelProps> = ({
  hex, title, subtitle, onClose, previewHeight = 80, width = "w-80", children,
}) => (
  <div className={`fixed bottom-4 right-4 ${width} bg-white border border-dark-200 rounded-xl shadow-xl overflow-hidden z-40`}>
    <div style={{ backgroundColor: hex, height: previewHeight }} />
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-dark-900">{title}</h4>
          {subtitle && <p className="text-sm font-mono text-dark-500">{subtitle}</p>}
        </div>
        <CloseButton onClick={onClose} />
      </div>
      {children}
    </div>
  </div>
);
```

---

### 2.5 Create `useCanvasTransform` hook (1 hour)

**Problem:** Pan/zoom logic duplicated in ColorForceGraphView and DerivationTreeView.

**Action:** Create shared hook:

```typescript
// src/components/color/hooks/useCanvasTransform.ts
export function useCanvasTransform(config: { minScale?: number; maxScale?: number } = {}) {
  const { minScale = 0.2, maxScale = 3 } = config;
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  const handlers = useMemo(() => ({
    onWheel: (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setTransform(prev => ({
        ...prev,
        scale: Math.max(minScale, Math.min(maxScale, prev.scale + delta * prev.scale)),
      }));
    },
    onMouseDown: (e: React.MouseEvent) => {
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    },
    onMouseMove: (e: React.MouseEvent) => {
      if (!isPanning) return;
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.clientX - lastPanPoint.current.x,
        y: prev.y + e.clientY - lastPanPoint.current.y,
      }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    },
    onMouseUp: () => setIsPanning(false),
    onMouseLeave: () => setIsPanning(false),
  }), [isPanning, minScale, maxScale]);

  return { transform, handlers, reset: () => setTransform({ x: 0, y: 0, scale: 1 }) };
}
```

---

### 2.6 Create generic CSS variable generator (1 hour)

**Problem:** CSS generation pattern repeated in typography, shadow, motion generators.

**Action:** Create in `src/server/transformers/css-utils.ts`:

```typescript
export function generateCSSVariableBlock<T extends Record<string, string | number>>(
  tokens: T,
  options: { indent?: string; headerComment?: string; prefix?: string } = {}
): string[] {
  const { indent = "  ", headerComment, prefix = "--" } = options;
  const lines: string[] = [];

  if (headerComment) {
    lines.push("", `${indent}/* ${headerComment} */`, "");
  }

  for (const [key, value] of Object.entries(tokens)) {
    lines.push(`${indent}${prefix}${toKebabCase(key)}: ${value};`);
  }

  return lines;
}
```

---

## Phase 3: Architectural Changes (6-8 hours)

Larger refactors for long-term maintainability.

### 3.1 Extract preview components from GenerationFlowChart (4 hours)

**Problem:** 671-line monolith with 9 inline preview components.

**Target structure:**
```
src/components/generation/
  previews/
    VisualDirectionPreview.tsx
    TailwindColorsPreview.tsx
    FoundationsPreview.tsx
    TailwindSystemPreview.tsx
    TypographyPreview.tsx
    DesignTokensPreview.tsx
    ComponentCSSPreview.tsx
    ContrastValidationPreview.tsx
    index.ts
  GenerationFlowChart.tsx (reduced to ~200 lines)
```

---

### 3.2 Decompose useDesignGeneration hook (4 hours)

**Problem:** 510-line hook with too many responsibilities.

**Target structure:**
```typescript
// useSSEConnection.ts - fetch + ReadableStream management
// useGenerationPhases.ts - phase state machine
// useDesignGeneration.ts - orchestrates the above (~150 lines)
```

---

### 3.3 Move transformTailwindToStyleGraph to transformers (2 hours)

**Problem:** 100+ line method in orchestrator belongs in dedicated transformer.

**Action:** Move to `src/server/transformers/tailwind-to-stylegraph.ts`

---

## Recommended Directory Structure

```
src/
  components/
    color/
      shared/
        CloseButton.tsx
        ColorDetailPanel.tsx
        FilterBanner.tsx
        OKLCHDisplay.tsx
        RootBadge.tsx
        index.ts
      hooks/
        useResolvedColors.ts
        useCanvasTransform.ts
        useInteractiveSelection.ts
        index.ts
      utils/
        tokenNameUtils.ts
        index.ts
      [existing visualization components]
    generation/
      previews/
        [8 preview components]
        index.ts
      GenerationFlowChart.tsx
    ui/
      SectionHeader.tsx
  constants/
    generationPhases.ts
  lib/utils/
    string-utils.ts
  server/transformers/
    css-utils.ts
    tailwind-to-stylegraph.ts
```

---

## Implementation Order

### Week 1: Quick Wins
- [ ] 1.1 Consolidate TAILWIND_STEPS
- [ ] 1.2 Extract toKebabCase
- [ ] 1.3 Extract shortenTokenName
- [ ] 1.4 Add getAccessibleTextColor
- [ ] 1.5 Extract CloseButton
- [ ] 1.6 Extract FilterBanner
- [ ] 1.7 Create SectionHeader

### Week 2: Strategic Improvements
- [ ] 2.1 Create shared phase configuration
- [ ] 2.2 Extract OKLCHDisplay
- [ ] 2.3 Create useResolvedColors hook
- [ ] 2.4 Extract ColorDetailPanel
- [ ] 2.5 Create useCanvasTransform hook
- [ ] 2.6 Create CSS variable generator

### Week 3: Architecture
- [ ] 3.1 Extract preview components
- [ ] 3.2 Decompose useDesignGeneration
- [ ] 3.3 Move transformTailwindToStyleGraph

---

## Success Metrics

After completing all phases:
- **Lines reduced:** ~800-1,000 lines of duplication removed
- **Files created:** ~15 new focused modules
- **Test coverage:** Easier to unit test isolated utilities and hooks
- **Maintenance:** Single source of truth for shared patterns
