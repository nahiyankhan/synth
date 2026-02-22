/**
 * Design Token Parser
 *
 * Loads YAML design tokens and converts them to StyleNodes.
 * Filters out legacy, platform-specific, and P3 color space tokens.
 * Converts path-based references to ID-based references.
 */

import * as yaml from "js-yaml";
import * as fs from "fs/promises";
import * as path from "path";
import { nanoid } from "nanoid";
import {
  StyleNode,
  StyleLayer,
  StyleType,
  StyleValue,
  StyleReference,
  ModeMap,
  isReference,
  isModeMap,
} from "@/types/styleGraph";
import { hexToOKLCH } from "./colorScience";

interface ParsedToken {
  path: string[];
  value: any;
  originalPath: string; // File path
}

/**
 * Check if a file should be excluded
 */
function shouldExcludeFile(filepath: string): boolean {
  const filename = path.basename(filepath);
  const dirpath = path.dirname(filepath);

  // Exclude patterns
  const excludePatterns = [
    /^legacy-/, // legacy-base.yaml, legacy-mappings.yaml
    /\/p3\//, // p3/ directory
    /\/android\//, // android/ directories
    /\/ios\//, // ios/ directories
    /\/web\//, // web/ directories (focus on mobile)
    /\/afterpay\//, // afterpay/ directory (different token structure)
    /-mono\.yaml$/, // *-mono.yaml files
    /ripple-alpha/, // Android-specific ripple files
  ];

  return excludePatterns.some(
    (pattern) => pattern.test(filepath) || pattern.test(filename)
  );
}

/**
 * Determine layer from path
 */
function determineLayer(tokenPath: string[]): StyleLayer {
  const rootCategory = tokenPath[0]?.toLowerCase();

  if (rootCategory === "base") return "primitive";
  if (rootCategory === "semantic") return "utility";
  if (rootCategory === "component") return "composite";

  // Default fallback
  return "primitive";
}

/**
 * Determine type from path and value
 */
function determineType(tokenPath: string[], value: any): StyleType {
  const pathStr = tokenPath.join(".").toLowerCase();

  if (
    pathStr.includes("color") ||
    pathStr.includes("background") ||
    pathStr.includes("border") ||
    pathStr.includes("text.") ||
    pathStr.includes("icon.")
  ) {
    // Check if value looks like a color
    if (
      typeof value === "string" &&
      (value.startsWith("#") || value.startsWith("rgb"))
    ) {
      return "color";
    }
    // Or if it references a color
    if (isReference(value) && value.includes("color")) {
      return "color";
    }
    return "color";
  }

  if (
    pathStr.includes("typography") ||
    pathStr.includes("font") ||
    pathStr.includes("weight") ||
    (pathStr.includes("size") && pathStr.includes("line-height"))
  ) {
    return "typography";
  }

  if (
    pathStr.includes("spacing") ||
    pathStr.includes("margin") ||
    pathStr.includes("padding") ||
    pathStr.includes("size") ||
    pathStr.includes("width") ||
    pathStr.includes("height") ||
    pathStr.includes("radius")
  ) {
    return "size";
  }

  return "other";
}

/**
 * Recursively flatten nested YAML structure into token paths
 */
function flattenTokens(
  obj: any,
  currentPath: string[] = [],
  originalPath: string = ""
): ParsedToken[] {
  const tokens: ParsedToken[] = [];

  if (obj === null || typeof obj !== "object") {
    return tokens;
  }

  for (const [key, value] of Object.entries(obj)) {
    // Skip 'extend' properties (component inheritance mechanism)
    if (key === "extend") {
      continue;
    }

    const newPath = [...currentPath, key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Check if this object has 'value' or 'id' properties (leaf node in token format)
      if ("value" in value || "id" in value) {
        // This is a leaf token
        tokens.push({
          path: newPath,
          value: value.value !== undefined ? value.value : value,
          originalPath,
        });
      } else {
        // Continue recursing
        tokens.push(...flattenTokens(value, newPath, originalPath));
      }
    } else {
      // Primitive value - treat as leaf
      tokens.push({
        path: newPath,
        value,
        originalPath,
      });
    }
  }

  return tokens;
}

/**
 * Extract name from token path
 * For now, just use the full path string
 */
function extractName(tokenPath: string[]): string {
  return tokenPath.join(".");
}

/**
 * Parse token value, handling references and mode maps
 */
function parseTokenValue(
  value: any
): StyleValue | StyleReference | ModeMap<StyleValue> | ModeMap<StyleReference> {
  // Handle mode-specific values (light/dark)
  if (isModeMap(value)) {
    const modeMap: ModeMap<any> = {};
    for (const [mode, modeValue] of Object.entries(value)) {
      if (modeValue !== undefined) {
        modeMap[mode] = parseTokenValue(modeValue);
      }
    }
    return modeMap;
  }

  // Handle references
  if (isReference(value)) {
    return value as StyleReference;
  }

  // Primitive value
  return value as StyleValue;
}

/**
 * Convert ParsedToken to StyleNode with temporary path tracking
 */
function createStyleNode(
  parsedToken: ParsedToken
): StyleNode & { _tempPath: string } {
  const id = nanoid(); // Generate unique short ID
  const pathString = parsedToken.path.join(".");
  const name = extractName(parsedToken.path);
  const layer = determineLayer(parsedToken.path);
  const value = parseTokenValue(parsedToken.value);
  const type = determineType(parsedToken.path, value);

  const node: StyleNode & { _tempPath: string } = {
    id,
    name,
    layer,
    type,
    value,
    dependencies: new Set<string>(),
    dependents: new Set<string>(),
    metadata: {
      compositeFor: layer === "composite" ? parsedToken.path[1] : undefined,
      isSpec: layer === "composite",
      createdFrom: "import",
    },
    _tempPath: pathString,
  };

  // Auto-compute OKLCH for color nodes
  if (type === "color" && typeof value === "string" && value.startsWith("#")) {
    try {
      const oklch = hexToOKLCH(value);
      node.metadata!.colorScience = {
        oklch,
        computed: true,
      };
    } catch (error) {
      console.warn(`Failed to compute OKLCH for ${name}:`, error);
    }
  }

  return node;
}

/**
 * Merge mode-suffixed tokens into single nodes with ModeMap values
 */
function mergeModeTokens(
  nodes: Array<StyleNode & { _tempPath: string }>
): Array<StyleNode & { _tempPath: string }> {
  const merged: Array<StyleNode & { _tempPath: string }> = [];
  const modeTokens = new Map<
    string,
    {
      light?: StyleNode & { _tempPath: string };
      dark?: StyleNode & { _tempPath: string };
    }
  >();
  const nonModeTokens: Array<StyleNode & { _tempPath: string }> = [];

  // Group tokens by base path
  for (const node of nodes) {
    if (node._tempPath.endsWith(".light")) {
      const basePath = node._tempPath.slice(0, -6); // Remove '.light'
      if (!modeTokens.has(basePath)) {
        modeTokens.set(basePath, {});
      }
      modeTokens.get(basePath)!.light = node;
    } else if (node._tempPath.endsWith(".dark")) {
      const basePath = node._tempPath.slice(0, -5); // Remove '.dark'
      if (!modeTokens.has(basePath)) {
        modeTokens.set(basePath, {});
      }
      modeTokens.get(basePath)!.dark = node;
    } else {
      nonModeTokens.push(node);
    }
  }

  // Merge paired light/dark tokens into ModeMap nodes
  for (const [basePath, modes] of modeTokens.entries()) {
    if (modes.light && modes.dark) {
      // Both modes exist - create merged node with ModeMap value
      const mergedNode: StyleNode & { _tempPath: string } = {
        ...modes.light,
        name: basePath, // Use base path as name
        value: {
          light: modes.light.value,
          dark: modes.dark.value,
        } as ModeMap<any>,
        _tempPath: basePath,
      };
      merged.push(mergedNode);
    } else {
      // Only one mode exists - keep as-is
      if (modes.light) merged.push(modes.light);
      if (modes.dark) merged.push(modes.dark);
    }
  }

  // Add non-mode tokens
  merged.push(...nonModeTokens);

  return merged;
}

/**
 * Normalize references - now all tokens use ModeMap, so references don't need mode suffixes
 */
function normalizePathReferences(
  nodes: Array<StyleNode & { _tempPath: string }>
): void {
  const availablePaths = new Set<string>();

  // Build set of all available paths
  for (const node of nodes) {
    availablePaths.add(node._tempPath);
  }

  // Normalize references in all nodes
  for (const node of nodes) {
    if (isReference(node.value)) {
      node.value = normalizeReference(
        node.value as string,
        node._tempPath,
        availablePaths
      );
    } else if (isModeMap(node.value)) {
      const modeMap = node.value as ModeMap<any>;
      for (const [mode, val] of Object.entries(modeMap)) {
        if (val !== undefined && isReference(val)) {
          modeMap[mode] = normalizeReference(
            val as string,
            node._tempPath,
            availablePaths
          );
        }
      }
    }
  }
}

function normalizeReference(
  ref: string,
  contextPath: string,
  availablePaths: Set<string>
): string {
  const refPath = ref.slice(1, -1); // Remove { and }
  const parts = refPath.split(".");
  const lastPart = parts[parts.length - 1];

  // If reference already has mode suffix, strip it (all tokens now use ModeMap)
  if (lastPart === "light" || lastPart === "dark") {
    const basePath = parts.slice(0, -1).join(".");
    // Check if base path exists (should be a ModeMap token now)
    if (availablePaths.has(basePath)) {
      return `{${basePath}}`;
    }
  }

  // Reference is fine as-is
  return ref;
}

/**
 * Load and parse all YAML files from a design system directory
 * Converts path-based references to ID-based references
 */
export async function loadDesignSystem(
  designTokensPath: string
): Promise<StyleNode[]> {
  const allNodes: Array<StyleNode & { _tempPath: string }> = [];

  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (shouldExcludeFile(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml"))
        ) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const parsed = yaml.load(content);

            if (parsed && typeof parsed === "object") {
              const tokens = flattenTokens(parsed, [], fullPath);
              const nodes = tokens.map(createStyleNode);
              allNodes.push(...nodes);
            }
          } catch (error: any) {
            console.warn(`Failed to parse ${fullPath}:`, error.message);
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to scan directory ${dirPath}:`, error.message);
      throw error;
    }
  }

  await scanDirectory(designTokensPath);

  // Merge mode-suffixed tokens into ModeMap format
  const merged = mergeModeTokens(allNodes);
  normalizePathReferences(merged);

  // Build temporary path-to-ID mapping
  const pathToIdMap = new Map<string, string>();
  for (const node of merged) {
    pathToIdMap.set(node._tempPath, node.id);
  }

  // Convert all path-based references to ID-based references
  for (const node of merged) {
    convertReferencesToIds(node, pathToIdMap);
  }

  // Remove temporary _tempPath property
  const finalNodes: StyleNode[] = merged.map((node) => {
    const { _tempPath, ...cleanNode } = node;
    return cleanNode;
  });

  console.log(`Loaded ${finalNodes.length} tokens from design system`);
  return finalNodes;
}

/**
 * Convert path-based references in a node to ID-based references
 */
function convertReferencesToIds(
  node: StyleNode & { _tempPath: string },
  pathToIdMap: Map<string, string>
): void {
  function convertValue(value: any): any {
    if (isReference(value)) {
      const refPath = value.slice(1, -1); // Remove { and }
      const targetId = pathToIdMap.get(refPath);
      if (targetId) {
        return `{${targetId}}`; // Convert to ID reference
      } else {
        console.warn(
          `Broken reference in ${node.name}: ${value} (path not found)`
        );
        return value; // Keep original if not found (will be caught by validation)
      }
    } else if (isModeMap(value)) {
      const result: ModeMap<any> = {};
      for (const [mode, modeValue] of Object.entries(value)) {
        if (modeValue !== undefined) {
          result[mode] = convertValue(modeValue);
        }
      }
      return result;
    }
    return value;
  }

  node.value = convertValue(node.value);
}

/**
 * Extract all reference IDs from a StyleNode
 */
export function extractReferences(node: StyleNode): string[] {
  const refs: string[] = [];

  function collectRefs(value: any): void {
    if (isReference(value)) {
      // Extract ID from reference: '{abc123xyz}' → 'abc123xyz'
      const refId = value.slice(1, -1);
      refs.push(refId);
    } else if (isModeMap(value)) {
      for (const modeValue of Object.values(value)) {
        if (modeValue !== undefined) {
          collectRefs(modeValue);
        }
      }
    }
  }

  collectRefs(node.value);
  return refs;
}

/**
 * Build dependency graph edges
 * References are now ID-based, so this is much simpler
 */
export function buildDependencyGraph(nodes: StyleNode[]): void {
  // Create lookup map
  const nodeMap = new Map<string, StyleNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build edges
  for (const node of nodes) {
    const refIds = extractReferences(node);
    node.dependencies.clear();

    for (const targetId of refIds) {
      const targetNode = nodeMap.get(targetId);
      if (targetNode) {
        node.dependencies.add(targetId);
        targetNode.dependents.add(node.id);
      } else {
        console.warn(
          `Broken reference in ${node.name}: references non-existent node ${targetId}`
        );
      }
    }
  }
}
