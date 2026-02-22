/**
 * Tailwind to StyleGraph Transformer
 *
 * Transforms Tailwind color system and typography choices into StyleGraph nodes.
 */

import { nanoid } from "nanoid";
import type { StyleNode } from "@/types/styleGraph";
import { TAILWIND_STEPS } from "@/types/tailwindPalette";
import type { ColorSystemOutput } from "./tailwind-color-system";
import type { TypographyChoices } from "@/server/schemas/llm-schemas";
import { getSemanticTokenDependencies } from "./semantic-token-mapper";
import {
  transformTypographyToNodes,
  generateSpacingTokens,
  generateMotionTokens,
  buildDependencyGraph,
} from "./llm-to-stylegraph";

/**
 * Transform Tailwind color system and typography choices into StyleGraph nodes.
 *
 * This creates:
 * 1. Palette nodes (primitive layer) - e.g., blue-500, gray-100
 * 2. Semantic nodes (utility layer) - e.g., primary, surface, text-muted
 * 3. Typography nodes - font sizes, line heights, letter spacing
 * 4. Spacing nodes - based on rhythm grid
 * 5. Motion nodes - durations and easings
 *
 * Dependencies are established between semantic tokens and their source palette colors.
 */
export function transformTailwindToStyleGraph(
  colorSystem: ColorSystemOutput,
  typographyChoices: TypographyChoices
): StyleNode[] {
  const nodes: StyleNode[] = [];
  const { semantics, palettes } = colorSystem;
  const steps = TAILWIND_STEPS;

  // =========================================================================
  // 1. Create palette nodes FIRST and store their IDs
  // =========================================================================
  const paletteNodeIds = new Map<string, string>(); // "blue-600" -> nodeId

  for (const [paletteName, palette] of palettes.palettes) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nodeId = nanoid(10);
      const nodeName = `${paletteName}-${step}`;

      paletteNodeIds.set(nodeName, nodeId);

      nodes.push({
        id: nodeId,
        name: nodeName,
        type: "color",
        layer: "primitive",
        value:
          palette.light[i] === palette.dark[i]
            ? palette.light[i]
            : { light: palette.light[i], dark: palette.dark[i] },
        dependencies: new Set(),
        dependents: new Set(),
        metadata: {
          createdFrom: "tailwind-color-system",
        },
      });
    }
  }

  // =========================================================================
  // 2. Get semantic token dependencies and create semantic nodes WITH refs
  // =========================================================================
  const tokenDeps = getSemanticTokenDependencies(palettes.roleMapping);
  const semanticKeys = Object.keys(semantics.light) as (keyof typeof semantics.light)[];

  for (const key of semanticKeys) {
    const deps = tokenDeps[key];
    const dependencies = new Set<string>();

    if (deps) {
      // Collect all palette node IDs this token depends on
      for (const source of deps.light) {
        const paletteKey = `${source.palette}-${source.step}`;
        const nodeId = paletteNodeIds.get(paletteKey);
        if (nodeId) dependencies.add(nodeId);
      }
      for (const source of deps.dark) {
        const paletteKey = `${source.palette}-${source.step}`;
        const nodeId = paletteNodeIds.get(paletteKey);
        if (nodeId) dependencies.add(nodeId);
      }
    }

    const nodeId = nanoid(10);
    nodes.push({
      id: nodeId,
      name: key,
      type: "color",
      layer: "utility",
      value:
        semantics.light[key] === semantics.dark[key]
          ? semantics.light[key]
          : { light: semantics.light[key], dark: semantics.dark[key] },
      dependencies,
      dependents: new Set(),
      metadata: {
        createdFrom: "tailwind-color-system",
      },
    });

    // Update dependents on the palette nodes
    for (const depId of dependencies) {
      const paletteNode = nodes.find((n) => n.id === depId);
      if (paletteNode) {
        paletteNode.dependents.add(nodeId);
      }
    }
  }

  // =========================================================================
  // 3. Non-color tokens (typography, spacing, motion)
  // =========================================================================
  nodes.push(...transformTypographyToNodes(typographyChoices));

  const rhythm = typographyChoices.scale?.rhythm || { grid: 8, round: "nearest" };
  nodes.push(
    ...generateSpacingTokens({
      grid: rhythm.grid || 8,
      round: rhythm.round || "nearest",
    })
  );

  nodes.push(...generateMotionTokens());

  // Build remaining dependency graph (for non-color tokens)
  buildDependencyGraph(nodes);

  return nodes;
}
