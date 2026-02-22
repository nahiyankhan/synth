/**
 * Test script for Tailwind v4 export functionality
 *
 * Run with: tsx scripts/testTailwindExport.ts
 */

import { StyleGraph } from "../src/core/StyleGraph.js";
import { generateTailwindExport } from "../src/services/tailwindConfigGenerator.js";
import * as fs from "fs/promises";
import * as path from "path";

async function testTailwindExport() {
  console.log("🎨 Testing Tailwind v4 Export\n");

  // Create a sample design system
  const graph = new StyleGraph();

  // Add color tokens
  graph.nodes.set("semantic.color.text.primary", {
    id: "semantic.color.text.primary",
    name: "semantic.color.text.primary",
    layer: "utility",
    type: "color",
    value: { light: "#0F172A", dark: "#F8FAFC" },
    dependencies: new Set(),
    dependents: new Set(),
  });

  graph.nodes.set("semantic.color.background.app", {
    id: "semantic.color.background.app",
    name: "semantic.color.background.app",
    layer: "utility",
    type: "color",
    value: { light: "#FFFFFF", dark: "#0F172A" },
    dependencies: new Set(),
    dependents: new Set(),
  });

  graph.nodes.set("base.color.blue.500", {
    id: "base.color.blue.500",
    name: "base.color.blue.500",
    layer: "primitive",
    type: "color",
    value: { light: "#3B82F6", dark: "#60A5FA" },
    dependencies: new Set(),
    dependents: new Set(),
  });

  // Add spacing tokens
  graph.nodes.set("base.spacing.md", {
    id: "base.spacing.md",
    name: "base.spacing.md",
    layer: "primitive",
    type: "spacing",
    value: { light: "16px" },
    dependencies: new Set(),
    dependents: new Set(),
  });

  // Add typography tokens
  graph.nodes.set("base.typography.fontSize.lg", {
    id: "base.typography.fontSize.lg",
    name: "base.typography.fontSize.lg",
    layer: "primitive",
    type: "typography",
    value: { light: "18px" },
    dependencies: new Set(),
    dependents: new Set(),
  });

  console.log("✓ Created sample design system with 5 tokens\n");

  // Generate Tailwind export
  console.log("📦 Generating Tailwind v4 export...\n");
  const result = generateTailwindExport(graph);

  // Display results
  console.log("=".repeat(60));
  console.log("THEME.CSS");
  console.log("=".repeat(60));
  console.log(result.themeConfig);
  console.log("\n");

  console.log("=".repeat(60));
  console.log("TOKENS.CSS");
  console.log("=".repeat(60));
  console.log(result.tokenUtilities);
  console.log("\n");

  console.log("=".repeat(60));
  console.log("README.MD (excerpt)");
  console.log("=".repeat(60));
  console.log(result.readme.substring(0, 500) + "...\n");

  // Optionally save to files
  const outputDir = path.join(process.cwd(), "tailwind-export-test");
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(path.join(outputDir, "theme.css"), result.themeConfig);
  await fs.writeFile(path.join(outputDir, "tokens.css"), result.tokenUtilities);
  await fs.writeFile(path.join(outputDir, "README.md"), result.readme);

  console.log(`✅ Export complete! Files saved to: ${outputDir}\n`);
  console.log("Files generated:");
  console.log("  - theme.css");
  console.log("  - tokens.css");
  console.log("  - README.md");
}

testTailwindExport().catch(console.error);
