/**
 * MCP Server for Design Language Agent
 *
 * Provides read-only access to design languages via Model Context Protocol
 *
 * Features:
 * - Resources: Browse design language data (metadata, tokens, stats)
 * - Tools: Query tokens, search, analyze impact
 * - Prompts: Templated workflows for common tasks
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Browser APIs are not available in Node.js, so we need to provide polyfills
// IndexedDB polyfill for Node.js environment
import { indexedDB } from "fake-indexeddb";
(globalThis as any).indexedDB = indexedDB;

import {
  getAllDesignLanguages,
  loadDesignLanguageData,
  loadDesignLanguageMetadata,
  initDesignLanguageDB,
  DesignLanguageMetadata,
} from "../services/designLanguageDB.js";

import { StyleGraph } from "../core/StyleGraph.js";
import { GetTokenHandler } from "../tools/handlers/query/GetTokenHandler.js";
import { SearchTokensHandler } from "../tools/handlers/query/SearchTokensHandler.js";

/**
 * Helper to load StyleGraph from design language ID
 */
async function loadStyleGraph(designLanguageId: string): Promise<StyleGraph> {
  const jsonData = await loadDesignLanguageData(designLanguageId);

  if (!jsonData) {
    throw new Error(`Design language "${designLanguageId}" not found`);
  }

  const styleGraph = new StyleGraph();
  styleGraph.importFromJSON(jsonData);
  return styleGraph;
}

/**
 * Format metadata for display
 */
function formatMetadata(metadata: DesignLanguageMetadata): string {
  return JSON.stringify(
    {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      tokenCount: metadata.tokenCount,
      lastModified: metadata.lastModified,
      createdAt: metadata.createdAt,
      generationMetadata: metadata.generationMetadata,
    },
    null,
    2
  );
}

/**
 * Main MCP Server class
 */
class DesignLanguageMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "design-language-agent",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup all MCP request handlers
   */
  private setupHandlers() {
    // ========================================
    // RESOURCES: File-like access to design languages
    // ========================================

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const languages = await getAllDesignLanguages();

        const resources = languages.flatMap((lang) => [
          {
            uri: `design-language://${lang.id}/metadata`,
            name: `${lang.name} - Metadata`,
            mimeType: "application/json",
            description: lang.description || `Metadata for ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/tokens`,
            name: `${lang.name} - All Tokens`,
            mimeType: "application/json",
            description: `All ${lang.tokenCount} tokens in ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/tokens/colors`,
            name: `${lang.name} - Color Tokens`,
            mimeType: "application/json",
            description: `Color tokens from ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/tokens/typography`,
            name: `${lang.name} - Typography Tokens`,
            mimeType: "application/json",
            description: `Typography tokens from ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/tokens/sizes`,
            name: `${lang.name} - Size Tokens`,
            mimeType: "application/json",
            description: `Size tokens from ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/tokens/primitives`,
            name: `${lang.name} - Primitive Tokens`,
            mimeType: "application/json",
            description: `Primitive layer tokens from ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/tokens/utilities`,
            name: `${lang.name} - Utility Tokens`,
            mimeType: "application/json",
            description: `Utility layer tokens from ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/stats`,
            name: `${lang.name} - Statistics`,
            mimeType: "application/json",
            description: `Design system statistics for ${lang.name}`,
          },
          {
            uri: `design-language://${lang.id}/export/json`,
            name: `${lang.name} - Export (JSON)`,
            mimeType: "application/json",
            description: `Full JSON export of ${lang.name}`,
          },
        ]);

        return { resources };
      } catch (error: any) {
        console.error("Error listing resources:", error);
        return { resources: [] };
      }
    });

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        try {
          const url = new URL(request.params.uri);
          const parts = url.pathname.split("/").filter(Boolean);
          const [designLanguageId, resourceType, subType] = parts;

          if (resourceType === "metadata") {
            const metadata = await loadDesignLanguageMetadata(designLanguageId);
            if (!metadata) {
              throw new Error(
                `Design language "${designLanguageId}" not found`
              );
            }

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: formatMetadata(metadata),
                },
              ],
            };
          }

          if (resourceType === "tokens") {
            const styleGraph = await loadStyleGraph(designLanguageId);
            let nodes = Array.from(styleGraph.nodes.values());

            // Filter by type or layer if specified
            if (subType === "colors") {
              nodes = nodes.filter((n) => n.type === "color");
            } else if (subType === "typography") {
              nodes = nodes.filter((n) => n.type === "typography");
            } else if (subType === "sizes") {
              nodes = nodes.filter((n) => n.type === "size");
            } else if (subType === "primitives") {
              nodes = nodes.filter((n) => n.layer === "primitive");
            } else if (subType === "utilities") {
              nodes = nodes.filter((n) => n.layer === "utility");
            }

            // Convert Sets to Arrays for JSON serialization
            const serializable = nodes.map((node) => ({
              ...node,
              dependencies: Array.from(node.dependencies),
              dependents: Array.from(node.dependents),
            }));

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: JSON.stringify(serializable, null, 2),
                },
              ],
            };
          }

          if (resourceType === "stats") {
            const styleGraph = await loadStyleGraph(designLanguageId);
            const stats = styleGraph.getStats();

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: JSON.stringify(stats, null, 2),
                },
              ],
            };
          }

          if (resourceType === "export" && subType === "json") {
            const styleGraph = await loadStyleGraph(designLanguageId);
            const exported = styleGraph.exportToJSON();

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: exported,
                },
              ],
            };
          }

          throw new Error(`Unknown resource: ${request.params.uri}`);
        } catch (error: any) {
          throw new Error(`Error reading resource: ${error.message}`);
        }
      }
    );

    // ========================================
    // TOOLS: Function-like queries
    // ========================================

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "listDesignLanguages",
            description: "Get all available design languages with metadata",
            inputSchema: {
              type: "object",
              properties: {
                sortBy: {
                  type: "string",
                  enum: ["name", "lastModified", "tokenCount"],
                  description: "Sort results by field",
                },
              },
            },
          },
          {
            name: "getToken",
            description:
              "Get detailed information about a specific token including resolved values and dependencies",
            inputSchema: {
              type: "object",
              properties: {
                designLanguageId: {
                  type: "string",
                  description: "ID of the design language",
                },
                path: {
                  type: "string",
                  description: "Token path (e.g., 'base.color.grey.65')",
                },
                mode: {
                  type: "string",
                  enum: ["light", "dark"],
                  description: "Optional: Mode to resolve value in",
                },
              },
              required: ["designLanguageId", "path"],
            },
          },
          {
            name: "searchTokens",
            description:
              "Search tokens by query, layer, type, or intent metadata",
            inputSchema: {
              type: "object",
              properties: {
                designLanguageId: {
                  type: "string",
                  description: "ID of the design language",
                },
                query: {
                  type: "string",
                  description: "Search query to match against token names",
                },
                layer: {
                  type: "string",
                  enum: ["primitive", "utility", "composite"],
                  description: "Filter by layer",
                },
                type: {
                  type: "string",
                  enum: ["color", "typography", "size", "other"],
                  description: "Filter by type",
                },
                quality: {
                  type: "string",
                  description: "Filter by intent quality (e.g., 'trustworthy')",
                },
                designedFor: {
                  type: "string",
                  description: "Filter by usage (e.g., 'buttons')",
                },
                response_mode: {
                  type: "string",
                  enum: ["summary", "full"],
                  description: "Control output verbosity (default: summary)",
                },
              },
              required: ["designLanguageId"],
            },
          },
          {
            name: "getImpactAnalysis",
            description:
              "Analyze the impact of changing a token (shows what would be affected)",
            inputSchema: {
              type: "object",
              properties: {
                designLanguageId: {
                  type: "string",
                  description: "ID of the design language",
                },
                path: {
                  type: "string",
                  description: "Token path to analyze",
                },
              },
              required: ["designLanguageId", "path"],
            },
          },
          {
            name: "getSystemStats",
            description: "Get overall design language statistics",
            inputSchema: {
              type: "object",
              properties: {
                designLanguageId: {
                  type: "string",
                  description: "ID of the design language",
                },
                includeSpecs: {
                  type: "boolean",
                  description:
                    "Include composite specs in statistics (default: false)",
                },
              },
              required: ["designLanguageId"],
            },
          },
          {
            name: "exportDesignSystem",
            description: "Export design language to JSON or YAML format",
            inputSchema: {
              type: "object",
              properties: {
                designLanguageId: {
                  type: "string",
                  description: "ID of the design language",
                },
                format: {
                  type: "string",
                  enum: ["json", "yaml"],
                  description: "Export format (default: json)",
                },
              },
              required: ["designLanguageId"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (name === "listDesignLanguages") {
          const languages = await getAllDesignLanguages();
          const sortBy = (args as any)?.sortBy || "lastModified";

          if (sortBy === "name") {
            languages.sort((a, b) => a.name.localeCompare(b.name));
          } else if (sortBy === "tokenCount") {
            languages.sort((a, b) => b.tokenCount - a.tokenCount);
          }
          // default: already sorted by lastModified

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(languages, null, 2),
              },
            ],
          };
        }

        // All other tools need designLanguageId
        const { designLanguageId } = args as any;
        if (!designLanguageId) {
          throw new Error("designLanguageId is required");
        }

        const styleGraph = await loadStyleGraph(designLanguageId);

        if (name === "getToken") {
          const handler = new GetTokenHandler(styleGraph);
          const result = await handler.execute(args);

          if (!result.success) {
            throw new Error(result.error);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        }

        if (name === "searchTokens") {
          const handler = new SearchTokensHandler(styleGraph);
          const result = await handler.execute(args);

          if (!result.success) {
            throw new Error(result.error);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        }

        if (name === "getImpactAnalysis") {
          const { path } = args as any;
          const impact = styleGraph.getImpactAnalysis(path);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(impact, null, 2),
              },
            ],
          };
        }

        if (name === "getSystemStats") {
          const stats = styleGraph.getStats();

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }

        if (name === "exportDesignSystem") {
          const { format } = args as any;

          if (format === "yaml") {
            const exported = styleGraph.exportToYAML();
            return {
              content: [
                {
                  type: "text",
                  text: exported,
                },
              ],
            };
          }

          // default: json
          const exported = styleGraph.exportToJSON();
          return {
            content: [
              {
                type: "text",
                text: exported,
              },
            ],
          };
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // ========================================
    // PROMPTS: Templated workflows
    // ========================================

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "analyze_design_system",
            description: "Analyze a design system and suggest improvements",
            arguments: [
              {
                name: "designLanguageId",
                description: "ID of the design language to analyze",
                required: true,
              },
            ],
          },
          {
            name: "compare_design_languages",
            description: "Compare two design languages side by side",
            arguments: [
              {
                name: "language1",
                description: "First design language ID",
                required: true,
              },
              {
                name: "language2",
                description: "Second design language ID",
                required: true,
              },
            ],
          },
          {
            name: "accessibility_audit",
            description: "Audit color contrast and accessibility compliance",
            arguments: [
              {
                name: "designLanguageId",
                description: "ID of the design language",
                required: true,
              },
              {
                name: "wcagLevel",
                description: "WCAG compliance level (AA or AAA)",
                required: false,
              },
            ],
          },
          {
            name: "generate_documentation",
            description: "Generate comprehensive design system documentation",
            arguments: [
              {
                name: "designLanguageId",
                description: "ID of the design language",
                required: true,
              },
              {
                name: "audience",
                description: "Target audience (developers, designers, or both)",
                required: false,
              },
            ],
          },
        ],
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (name === "analyze_design_system") {
          const { designLanguageId } = args as any;
          const metadata = await loadDesignLanguageMetadata(designLanguageId);

          if (!metadata) {
            throw new Error(`Design language "${designLanguageId}" not found`);
          }

          const styleGraph = await loadStyleGraph(designLanguageId);
          const stats = styleGraph.getStats();

          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Analyze the "${metadata.name}" design system and suggest improvements.

Design System Overview:
- Name: ${metadata.name}
- Total Tokens: ${metadata.tokenCount}
- Primitives: ${stats.byLayer.primitive}
- Utilities: ${stats.byLayer.utility}
- Composites: ${stats.byLayer.composite}
- Colors: ${stats.byType.color}
- Typography: ${stats.byType.typography}
- Last Modified: ${metadata.lastModified}

Please analyze:
1. **Consistency**: Are naming conventions consistent?
2. **Accessibility**: Are colors accessible? Any contrast issues?
3. **Scalability**: Can this system grow without becoming unwieldy?
4. **Semantic naming**: Are tokens named by purpose, not appearance?
5. **Dependencies**: Are there circular dependencies or broken references?
6. **Coverage**: Are there gaps in the token coverage?

Provide specific, actionable recommendations.`,
                },
              },
            ],
          };
        }

        if (name === "compare_design_languages") {
          const { language1, language2 } = args as any;

          const [meta1, meta2] = await Promise.all([
            loadDesignLanguageMetadata(language1),
            loadDesignLanguageMetadata(language2),
          ]);

          if (!meta1 || !meta2) {
            throw new Error("One or both design languages not found");
          }

          const [graph1, graph2] = await Promise.all([
            loadStyleGraph(language1),
            loadStyleGraph(language2),
          ]);

          const [stats1, stats2] = [graph1.getStats(), graph2.getStats()];

          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Compare these two design systems:

**${meta1.name}**
- Tokens: ${meta1.tokenCount}
- Primitives: ${stats1.byLayer.primitive}
- Utilities: ${stats1.byLayer.utility}
- Colors: ${stats1.byType.color}
- Typography: ${stats1.byType.typography}

**${meta2.name}**
- Tokens: ${meta2.tokenCount}
- Primitives: ${stats2.byLayer.primitive}
- Utilities: ${stats2.byLayer.utility}
- Colors: ${stats2.byType.color}
- Typography: ${stats2.byType.typography}

Please compare:
1. Scale and complexity
2. Naming conventions
3. Token organization
4. Strengths of each system
5. Which patterns could be shared
6. Migration considerations if consolidating`,
                },
              },
            ],
          };
        }

        if (name === "accessibility_audit") {
          const { designLanguageId, wcagLevel } = args as any;
          const level = wcagLevel || "AA";
          const metadata = await loadDesignLanguageMetadata(designLanguageId);

          if (!metadata) {
            throw new Error(`Design language "${designLanguageId}" not found`);
          }

          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Perform an accessibility audit on "${metadata.name}" design system for WCAG ${level} compliance.

Focus on:
1. **Color Contrast**: Check all text/background combinations
2. **Minimum Ratios**: 
   - Normal text: 4.5:1 (AA) or 7:1 (AAA)
   - Large text: 3:1 (AA) or 4.5:1 (AAA)
3. **Interactive Elements**: Button states, links, form controls
4. **Non-text Contrast**: Icons, borders, focus indicators (3:1 for AA)
5. **Touch Targets**: Minimum 44x44px for mobile
6. **Color Independence**: Don't rely solely on color

Use the color tokens from this design system and provide:
- Specific failing combinations
- Suggested fixes
- Pass/fail summary`,
                },
              },
            ],
          };
        }

        if (name === "generate_documentation") {
          const { designLanguageId, audience } = args as any;
          const audienceType = audience || "both";
          const metadata = await loadDesignLanguageMetadata(designLanguageId);

          if (!metadata) {
            throw new Error(`Design language "${designLanguageId}" not found`);
          }

          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Generate comprehensive documentation for "${
                    metadata.name
                  }" design system.

Target Audience: ${audienceType}

Please create:
1. **Overview**: Purpose, principles, and goals
2. **Getting Started**: How to use this design system
3. **Token Reference**: 
   - Primitives (raw values)
   - Utilities (semantic tokens)
   - Usage guidelines
4. **Color System**: Palette, accessibility, usage patterns
5. **Typography**: Type scale, font families, line heights
6. **Spacing & Sizing**: Scale, rhythm, responsive patterns
7. **Best Practices**: Do's and don'ts
8. **Code Examples**: ${
                    audienceType === "developers" || audienceType === "both"
                      ? "React, CSS, etc."
                      : "Figma, design tools"
                  }
9. **Migration Guide**: If updating from previous version

Format as markdown with clear sections and examples.`,
                },
              },
            ],
          };
        }

        throw new Error(`Unknown prompt: ${name}`);
      } catch (error: any) {
        throw new Error(`Error getting prompt: ${error.message}`);
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start() {
    // Initialize the database first
    await initDesignLanguageDB();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("Design Language MCP Server running on stdio");
    console.error("Ready to accept requests from MCP clients");
  }
}

// Run the server
const server = new DesignLanguageMCPServer();
server.start().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});


