/**
 * Export Design System to Static JSON
 *
 * Run this script in Node.js to export a design system
 * to a static JSON file that can be loaded in the browser.
 *
 * Usage: pnpm export:design-system [path-to-design-tokens]
 */

import { StyleGraph } from "../src/core/StyleGraph.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDesignSystem() {
  const designTokensPath = process.argv[2];

  if (!designTokensPath) {
    console.log("Usage: pnpm export:design-system <path-to-design-tokens>");
    console.log("\nExample: pnpm export:design-system /path/to/design-tokens");
    process.exit(1);
  }

  console.log("📦 Exporting design system...\n");

  try {
    // Create graph and load from YAML
    const graph = new StyleGraph();

    console.log(`Loading from: ${designTokensPath}`);
    await graph.loadFromYAML(designTokensPath);

    const stats = graph.getStats();
    console.log(`✓ Loaded ${stats.totalNodes} tokens`);
    console.log(
      `  Core: ${stats.coreTokensCount} (${stats.byLayer.primitive} primitives, ${stats.byLayer.utility} utilities)`
    );
    console.log(`  Specs: ${stats.specsCount} (composites)\n`);

    // Filter out tokens starting with "surface." or "semantic.color.accent"
    const allNodes = Array.from(graph.nodes.values());
    const filteredNodes = allNodes.filter(
      (node) =>
        !node.name.startsWith("surface.") &&
        !node.name.startsWith("semantic.color.accent")
    );
    const excludedCount = allNodes.length - filteredNodes.length;

    if (excludedCount > 0) {
      console.log(
        `🔍 Filtering: Excluded ${excludedCount} tokens (surface.*, semantic.color.accent*)\n`
      );
    }

    // Export to JSON (excluding tokens starting with "surface.")
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        source: designTokensPath,
        stats: {
          totalNodes: stats.totalNodes,
          coreTokens: stats.coreTokensCount,
          specs: stats.specsCount,
          byLayer: stats.byLayer,
          byType: stats.byType,
        },
      },
      nodes: filteredNodes.map((node) => ({
        id: node.id,
        name: node.name,
        layer: node.layer,
        type: node.type,
        value: node.value,
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents),
        metadata: node.metadata,
      })),
    };

    // Write to file
    const outputPath = path.join(__dirname, "../data/design-system.json");
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`✓ Exported to: data/design-system.json`);
    console.log(
      `  File size: ${(JSON.stringify(exportData).length / 1024).toFixed(
        2
      )} KB\n`
    );

    // Validation
    const errors = graph.validateGraph();
    if (errors.length === 0) {
      console.log("✓ No validation errors");
    } else {
      console.log(`⚠️  ${errors.length} validation errors found`);
    }

    console.log("\n✨ Export complete!\n");
  } catch (error: any) {
    console.error("❌ Export failed:", error.message);
    process.exit(1);
  }
}

exportDesignSystem();
