/**
 * Transform LLM outputs to StyleGraph nodes
 * Bridges the interface-machine design system format with our StyleGraph structure
 */

import { nanoid } from 'nanoid';
import type { StyleNode } from '../../types/styleGraph';
import type { ColorChoices, TypographyChoices } from '../schemas/llm-schemas';
import { generateTypographyTokens, type TypographySeedInput } from './typography-generator';
import { expandBaseColors, formatScaleToTokens, getMiddleShade } from './color-scale-generator';

/**
 * Convert baseColors array format to record format
 * The LLM returns [{name, hex}] but internal code expects {name: hex}
 */
function baseColorsToRecord(baseColors: ColorChoices['baseColors']): Record<string, string> {
  const record: Record<string, string> = {};
  for (const { name, hex } of baseColors) {
    record[name] = hex;
  }
  return record;
}

/**
 * Transform LLM color choices to StyleGraph nodes
 * Creates full color scales (50-900) for each base color using OKLCH
 * Plus semantic utility colors that reference these scales
 * 
 * All baseColors from LLM are considered "seeds" - the original colors chosen by the AI.
 * Only the specific shade closest to the original LLM color is marked with isSeed = true.
 */
export function transformColorsToNodes(colorChoices: ColorChoices): StyleNode[] {
  const nodes: StyleNode[] = [];
  const baseColorScaleNodes = new Map<string, Map<number, StyleNode>>();

  // Convert array format to record format for internal use
  const baseColorsRecord = baseColorsToRecord(colorChoices.baseColors);

  // Generate full color scales (50-900) for each base color
  const colorScales = expandBaseColors(baseColorsRecord, 10);

  Object.entries(colorScales).forEach(([colorName, scale]) => {
    const scaleMap = new Map<number, StyleNode>();
    const tokens = formatScaleToTokens(colorName, scale);

    // All colors from LLM are seeds - find which shade is closest to the original
    const originalColor = baseColorsRecord[colorName];
    let closestShadeStep: number | undefined;
    
    if (originalColor) {
      // Find the shade in the generated scale that's closest to the original LLM color
      let minDistance = Infinity;
      tokens.forEach(({ value, step }) => {
        if (step && value) {
          // Simple hex comparison (could be more sophisticated with color distance)
          if (value.toLowerCase() === originalColor.toLowerCase()) {
            closestShadeStep = step;
            minDistance = 0;
          } else if (minDistance > 0) {
            // If no exact match, use the middle shade (500) as default
            if (step === 500 && closestShadeStep === undefined) {
              closestShadeStep = step;
            }
          }
        }
      });
    }

    tokens.forEach(({ name, value, step }) => {
      // Only mark the specific shade that matches the LLM's original color as seed
      const isThisShadeTheSeed = step === closestShadeStep;
      
      const node: StyleNode = {
        id: nanoid(),
        name: `base.color.${name}`,
        layer: 'primitive',
        type: 'color',
        value: { light: value, dark: value },
        dependencies: new Set(),
        dependents: new Set(),
        metadata: {
          description: `${colorName} shade ${step}${isThisShadeTheSeed ? ' (LLM seed color)' : ''}`,
          createdFrom: 'voice',
          isSeed: isThisShadeTheSeed
        }
      };
      nodes.push(node);
      if (step) {
        scaleMap.set(step, node);
      }
    });

    baseColorScaleNodes.set(colorName, scaleMap);
  });

  // Create semantic color utilities (reference the 500 shade of base colors)
  Object.entries(colorChoices.semanticRoles).forEach(([role, baseColorName]) => {
    const scaleMap = baseColorScaleNodes.get(baseColorName);
    if (!scaleMap) {
      console.warn(`Semantic role ${role} references unknown base color: ${baseColorName}`);
      return;
    }

    // Reference the 500 shade (middle of scale)
    const baseNode = scaleMap.get(500);
    if (!baseNode) {
      console.warn(`No 500 shade found for ${baseColorName}`);
      return;
    }

    const node: StyleNode = {
      id: nanoid(),
      name: `semantic.color.${role}`,
      layer: 'utility',
      type: 'color',
      value: { light: `{${baseNode.id}}`, dark: `{${baseNode.id}}` },
      dependencies: new Set([baseNode.id]),
      dependents: new Set(),
      metadata: {
        description: `Semantic role: ${role} (maps to ${baseColorName}-500)`,
        createdFrom: 'voice'
      }
    };
    nodes.push(node);

    // Update base node's dependents
    baseNode.dependents.add(node.id);
  });

  return nodes;
}

/**
 * Transform LLM typography choices to StyleGraph nodes
 * Creates composite typography style nodes from type stack
 */
export function transformTypographyToNodes(typographyChoices: TypographyChoices): StyleNode[] {
  const nodes: StyleNode[] = [];

  // Create composite style nodes for each type in the stack
  if (typographyChoices.typeStack) {
    const typeStyles = [
      { name: 'display', data: typographyChoices.typeStack.display, description: 'Display/hero text style' },
      { name: 'h1', data: typographyChoices.typeStack.h1, description: 'Heading 1 style' },
      { name: 'h2', data: typographyChoices.typeStack.h2, description: 'Heading 2 style' },
      { name: 'h3', data: typographyChoices.typeStack.h3, description: 'Heading 3 style' },
      { name: 'body-large', data: typographyChoices.typeStack.bodyLarge, description: 'Large body text style' },
      { name: 'body', data: typographyChoices.typeStack.body, description: 'Default body text style' },
      { name: 'body-small', data: typographyChoices.typeStack.bodySmall, description: 'Small body text style' },
      { name: 'caption', data: typographyChoices.typeStack.caption, description: 'Caption text style' },
      { name: 'label', data: typographyChoices.typeStack.label, description: 'Label/button text style' },
      { name: 'code', data: typographyChoices.typeStack.code, description: 'Code/monospace text style' },
    ];

    typeStyles.forEach(({ name, data, description }) => {
      if (!data) return;

      // Create a composite value with all typography properties
      const compositeValue = {
        fontSize: data.fontSize,
        lineHeight: data.lineHeight,
        fontWeight: data.fontWeight || '400',
        ...(data.letterSpacing && { letterSpacing: data.letterSpacing }),
        ...(data.textTransform && { textTransform: data.textTransform }),
        ...(data.fontFamily && { fontFamily: data.fontFamily }),
      };

      const node: StyleNode = {
        id: nanoid(),
        name: `semantic.typography.${name}`,
        layer: 'utility',
        type: 'typography',
        value: { light: JSON.stringify(compositeValue), dark: JSON.stringify(compositeValue) },
        dependencies: new Set(),
        dependents: new Set(),
        metadata: {
          description,
          createdFrom: 'voice',
          typeStyle: name
        }
      };
      nodes.push(node);
    });
  }

  return nodes;
}

/**
 * Generate spacing tokens based on rhythm grid
 * Creates a systematic spacing scale
 */
export function generateSpacingTokens(rhythm: { grid: number; round: string }): StyleNode[] {
  const nodes: StyleNode[] = [];
  const spacingMultipliers = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16];

  spacingMultipliers.forEach((mult, i) => {
    const value = `${rhythm.grid * mult}px`;
    const node: StyleNode = {
      id: nanoid(),
      name: `base.spacing.${i}`,
      layer: 'primitive',
      type: 'size',
      value: { light: value, dark: value },
      dependencies: new Set(),
      dependents: new Set(),
      metadata: {
        description: `Spacing scale: ${mult}x rhythm grid (${value})`,
        createdFrom: 'voice'
      }
    };
    nodes.push(node);
  });

  return nodes;
}

/**
 * Generate motion/animation tokens
 * Creates duration and easing tokens for consistent animations
 */
export function generateMotionTokens(): StyleNode[] {
  const nodes: StyleNode[] = [];

  // Duration tokens
  const motionDefs = [
    { name: 'fast', value: '150ms', description: 'Fast animation duration (micro-interactions)' },
    { name: 'medium', value: '300ms', description: 'Medium animation duration (standard transitions)' },
    { name: 'slow', value: '500ms', description: 'Slow animation duration (major state changes)' },
  ];

  motionDefs.forEach(({ name, value, description }) => {
    const node: StyleNode = {
      id: nanoid(),
      name: `base.motion.duration.${name}`,
      layer: 'primitive',
      type: 'other',
      value: { light: value, dark: value },
      dependencies: new Set(),
      dependents: new Set(),
      metadata: {
        description,
        createdFrom: 'voice'
      }
    };
    nodes.push(node);
  });

  // Easing token
  const easingNode: StyleNode = {
    id: nanoid(),
    name: 'base.motion.easing.default',
    layer: 'primitive',
    type: 'other',
    value: { light: 'cubic-bezier(0.25, 0.1, 0.25, 1)', dark: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
    dependencies: new Set(),
    dependents: new Set(),
    metadata: {
      description: 'Default easing function (ease-in-out)',
      createdFrom: 'voice'
    }
  };
  nodes.push(easingNode);

  return nodes;
}

/**
 * Build dependency graph by updating dependents based on dependencies
 * This ensures the graph is properly linked in both directions
 */
export function buildDependencyGraph(nodes: StyleNode[]): void {
  // Create a map for quick lookup
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // For each node, update its dependencies' dependents
  nodes.forEach(node => {
    node.dependencies.forEach(depId => {
      const depNode = nodeMap.get(depId);
      if (depNode) {
        depNode.dependents.add(node.id);
      }
    });
  });
}

