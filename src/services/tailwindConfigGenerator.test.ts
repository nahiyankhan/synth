/**
 * Tests for Tailwind v4 Configuration Generator
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StyleGraph } from "@/core/StyleGraph";
import {
  generateTailwindV4Config,
  generateTailwindWithTokens,
  generateTailwindExport,
} from "./tailwindConfigGenerator";

describe("Tailwind v4 Config Generator", () => {
  let graph: StyleGraph;

  beforeEach(() => {
    graph = new StyleGraph();

    // Add some test tokens - manually add to nodes map
    graph.nodes.set("base.color.blue.500", {
      id: "base.color.blue.500",
      name: "base.color.blue.500",
      layer: "primitive",
      type: "color",
      value: { light: "#3B82F6", dark: "#60A5FA" },
      dependencies: new Set(),
      dependents: new Set(),
    });

    graph.nodes.set("semantic.color.text.primary", {
      id: "semantic.color.text.primary",
      name: "semantic.color.text.primary",
      layer: "utility",
      type: "color",
      value: { light: "#000000", dark: "#FFFFFF" },
      dependencies: new Set(),
      dependents: new Set(),
    });

    graph.nodes.set("semantic.color.background.app", {
      id: "semantic.color.background.app",
      name: "semantic.color.background.app",
      layer: "utility",
      type: "color",
      value: { light: "#FFFFFF", dark: "#1A1A1A" },
      dependencies: new Set(),
      dependents: new Set(),
    });

    graph.nodes.set("base.spacing.md", {
      id: "base.spacing.md",
      name: "base.spacing.md",
      layer: "primitive",
      type: "size",
      value: { light: "16px" },
      dependencies: new Set(),
      dependents: new Set(),
    });

    graph.nodes.set("base.typography.fontSize.lg", {
      id: "base.typography.fontSize.lg",
      name: "base.typography.fontSize.lg",
      layer: "primitive",
      type: "typography",
      value: { light: "18px" },
      dependencies: new Set(),
      dependents: new Set(),
    });
  });

  describe("generateTailwindV4Config", () => {
    it("should generate valid CSS with @theme directive", () => {
      const css = generateTailwindV4Config(graph);

      expect(css).toContain("@theme {");
      expect(css).toContain("Colors");
      expect(css).toBeTruthy();
    });

    it("should include color variables", () => {
      const css = generateTailwindV4Config(graph);

      // Should map semantic colors to Tailwind names
      expect(css).toContain("--color-foreground");
      expect(css).toContain("--color-background");
    });

    it("should include dark mode overrides", () => {
      const css = generateTailwindV4Config(graph);

      expect(css).toContain("@theme dark {");
      expect(css).toContain("Dark Mode");
    });

    it("should include spacing variables", () => {
      const css = generateTailwindV4Config(graph);

      expect(css).toContain("Spacing");
      expect(css).toContain("--spacing-");
    });

    it("should include typography variables", () => {
      const css = generateTailwindV4Config(graph);

      expect(css).toContain("Typography");
      expect(css).toContain("--font-size-");
    });

    it("should include usage examples in comments", () => {
      const css = generateTailwindV4Config(graph);

      expect(css).toContain("Usage Examples");
      expect(css).toContain("bg-primary");
      expect(css).toContain("text-foreground");
    });
  });

  describe("generateTailwindWithTokens", () => {
    it("should generate utility classes for tokens", () => {
      const css = generateTailwindWithTokens(graph);

      expect(css).toContain("@layer utilities {");
      expect(css).toContain(".text-token-");
      expect(css).toContain(".bg-token-");
      expect(css).toContain(".border-token-");
    });

    it("should create classes for each color token", () => {
      const css = generateTailwindWithTokens(graph);

      expect(css).toContain(".text-token-base-color-blue-500");
      expect(css).toContain(".bg-token-semantic-color-text-primary");
    });

    it("should include dark mode media query", () => {
      const css = generateTailwindWithTokens(graph);

      expect(css).toContain("@media (prefers-color-scheme: dark)");
    });
  });

  describe("generateTailwindExport", () => {
    it("should return all export files", () => {
      const result = generateTailwindExport(graph);

      expect(result).toHaveProperty("themeConfig");
      expect(result).toHaveProperty("tokenUtilities");
      expect(result).toHaveProperty("readme");
    });

    it("should generate non-empty theme config", () => {
      const result = generateTailwindExport(graph);

      expect(result.themeConfig).toBeTruthy();
      expect(result.themeConfig.length).toBeGreaterThan(100);
    });

    it("should generate non-empty token utilities", () => {
      const result = generateTailwindExport(graph);

      expect(result.tokenUtilities).toBeTruthy();
      expect(result.tokenUtilities.length).toBeGreaterThan(50);
    });

    it("should generate helpful README", () => {
      const result = generateTailwindExport(graph);

      expect(result.readme).toContain("# Design System");
      expect(result.readme).toContain("Tailwind");
      expect(result.readme).toContain("Installation");
      expect(result.readme).toContain("Option");
    });

    it("should include both import options in README", () => {
      const result = generateTailwindExport(graph);

      expect(result.readme).toContain("Option 1");
      expect(result.readme).toContain("Option 2");
      expect(result.readme).toContain("theme.css");
      expect(result.readme).toContain("tokens.css");
    });
  });

  describe("Color Mapping", () => {
    it("should map semantic text colors to foreground", () => {
      const css = generateTailwindV4Config(graph);

      expect(css).toContain("--color-foreground");
    });

    it("should map semantic background colors", () => {
      const css = generateTailwindV4Config(graph);

      expect(css).toContain("--color-background");
    });

    it("should handle color scales", () => {
      const css = generateTailwindV4Config(graph);

      // Blue-500 should be mapped
      expect(css).toContain("--color-blue-500");
    });
  });

  describe("Shadow/Effects Mapping", () => {
    it("should extract and map shadow tokens", () => {
      graph.nodes.set("base.shadow.lg", {
        id: "base.shadow.lg",
        name: "base.shadow.lg",
        layer: "primitive",
        type: "other",
        value: { light: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--shadow-lg");
      expect(css).toContain("Shadows & Elevation");
    });

    it("should map elevation levels to shadows", () => {
      graph.nodes.set("base.elevation.1", {
        id: "base.elevation.1",
        name: "base.elevation.1",
        layer: "primitive",
        type: "other",
        value: { light: "0 1px 3px 0 rgb(0 0 0 / 0.1)" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--shadow-");
    });

    it("should extract opacity tokens", () => {
      graph.nodes.set("base.opacity.50", {
        id: "base.opacity.50",
        name: "base.opacity.50",
        layer: "primitive",
        type: "other",
        value: { light: "0.5" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--opacity-50");
      expect(css).toContain("Opacity");
    });

    it("should extract blur tokens", () => {
      graph.nodes.set("effects.blur.md", {
        id: "effects.blur.md",
        name: "effects.blur.md",
        layer: "primitive",
        type: "other",
        value: { light: "8px" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--blur");
      expect(css).toContain("Blur");
    });

    it("should extract z-index tokens", () => {
      graph.nodes.set("layout.zIndex.10", {
        id: "layout.zIndex.10",
        name: "layout.zIndex.10",
        layer: "primitive",
        type: "other",
        value: { light: "10" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--z-10");
      expect(css).toContain("Z-Index");
    });

    it("should include shadow examples in usage comments", () => {
      graph.nodes.set("base.shadow.lg", {
        id: "base.shadow.lg",
        name: "base.shadow.lg",
        layer: "primitive",
        type: "other",
        value: { light: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("shadow-lg");
      expect(css).toContain("opacity-");
      expect(css).toContain("blur-");
      expect(css).toContain("z-");
    });
  });

  describe("Enhanced Semantic Mappings", () => {
    it("should map expanded text color variations", () => {
      graph.nodes.set("semantic.color.text.disabled", {
        id: "semantic.color.text.disabled",
        name: "semantic.color.text.disabled",
        layer: "utility",
        type: "color",
        value: { light: "#94A3B8" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--color-muted-foreground");
    });

    it("should map state colors", () => {
      graph.nodes.set("semantic.color.state.success", {
        id: "semantic.color.state.success",
        name: "semantic.color.state.success",
        layer: "utility",
        type: "color",
        value: { light: "#10B981" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--color-success");
    });

    it("should auto-detect Tailwind color names in paths", () => {
      graph.nodes.set("primitives.slate.200", {
        id: "primitives.slate.200",
        name: "primitives.slate.200",
        layer: "primitive",
        type: "color",
        value: { light: "#E2E8F0" },
        dependencies: new Set(),
        dependents: new Set(),
      });

      const css = generateTailwindV4Config(graph);
      expect(css).toContain("--color-slate-200");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty graph", () => {
      const emptyGraph = new StyleGraph();
      const css = generateTailwindV4Config(emptyGraph);

      expect(css).toContain("@theme {");
      expect(css).toBeTruthy();
    });

    it("should handle tokens without dark mode values", () => {
      const lightOnlyGraph = new StyleGraph();
      lightOnlyGraph.createNode({
        id: "base.color.red.500",
        name: "base.color.red.500",
        layer: "primitive",
        type: "color",
        value: { light: "#EF4444" },
      });

      const css = generateTailwindV4Config(lightOnlyGraph);
      expect(css).toContain("--color-red-500");
    });

    it("should handle tokens with only dark mode values", () => {
      const darkOnlyGraph = new StyleGraph();
      darkOnlyGraph.createNode({
        id: "base.color.green.500",
        name: "base.color.green.500",
        layer: "primitive",
        type: "color",
        value: { dark: "#10B981" },
      });

      const css = generateTailwindV4Config(darkOnlyGraph);
      expect(css).toBeTruthy();
    });
  });
});
