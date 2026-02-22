/**
 * Tool Registry
 * Central registry for all tool handlers with support for versioning and dynamic loading
 */

import { ToolHandler } from './ToolHandler';
import { ToolDefinition, ToolResponse } from '../types/toolRegistry';

export class ToolRegistry {
  private handlers = new Map<string, ToolHandler>();
  private versionedHandlers = new Map<string, ToolHandler>(); // key: name@version
  private latestVersions = new Map<string, string>(); // name -> latest version

  /**
   * Register a tool handler with the registry
   */
  register(handler: ToolHandler): void {
    const definition = handler.getDefinition();
    const name = definition.name;
    
    // Register by name (latest version)
    this.handlers.set(name, handler);
    
    // Register versioned
    if (definition.version) {
      const versionedKey = `${name}@${definition.version}`;
      this.versionedHandlers.set(versionedKey, handler);
      this.updateLatestVersion(name, definition.version);
    }
  }

  /**
   * Register multiple tool handlers
   */
  registerMany(handlers: ToolHandler[]): void {
    handlers.forEach(handler => this.register(handler));
  }

  /**
   * Execute a tool by name
   */
  async execute(name: string, params: unknown): Promise<ToolResponse> {
    const handler = this.handlers.get(name);
    
    if (!handler) {
      return {
        success: false,
        error: `Unknown tool: ${name}. Use get_design_system_operations to see available tools.`,
      };
    }
    
    return handler.execute(params);
  }

  /**
   * Execute a specific version of a tool
   */
  async executeVersion(name: string, version: string, params: unknown): Promise<ToolResponse> {
    const versionedKey = `${name}@${version}`;
    const handler = this.versionedHandlers.get(versionedKey);
    
    if (!handler) {
      return {
        success: false,
        error: `Tool ${name}@${version} not found`,
      };
    }
    
    return handler.execute(params);
  }

  /**
   * Get a tool handler by name
   */
  getHandler(name: string): ToolHandler | null {
    return this.handlers.get(name) || null;
  }

  /**
   * Get a specific version of a tool handler
   */
  getHandlerVersion(name: string, version: string): ToolHandler | null {
    const versionedKey = `${name}@${version}`;
    return this.versionedHandlers.get(versionedKey) || null;
  }

  /**
   * Get all tool definitions
   */
  getDefinitions(): ToolDefinition[] {
    return Array.from(this.handlers.values())
      .map(handler => handler.getDefinition());
  }

  /**
   * Get tool definitions by category
   */
  getDefinitionsByCategory(category: string): ToolDefinition[] {
    return this.getDefinitions()
      .filter(def => def.category === category);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.handlers.has(name);
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set(
      this.getDefinitions().map(def => def.category)
    );
    return Array.from(categories);
  }

  /**
   * Get the latest version of a tool
   */
  getLatestVersion(name: string): string | null {
    return this.latestVersions.get(name) || null;
  }

  /**
   * Get all versions of a tool
   */
  getVersions(name: string): string[] {
    const versions: string[] = [];
    
    for (const [key] of this.versionedHandlers) {
      if (key.startsWith(`${name}@`)) {
        const version = key.split('@')[1];
        versions.push(version);
      }
    }
    
    return versions;
  }

  /**
   * Update the latest version tracker
   */
  private updateLatestVersion(name: string, version: string): void {
    const current = this.latestVersions.get(name);
    
    if (!current || this.compareVersions(version, current) > 0) {
      this.latestVersions.set(name, version);
    }
  }

  /**
   * Compare two semantic versions
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  /**
   * Get statistics about the registry
   */
  getStats() {
    return {
      totalTools: this.handlers.size,
      totalVersions: this.versionedHandlers.size,
      categories: this.getCategories().length,
      byCategory: this.getDefinitions().reduce((acc, def) => {
        acc[def.category] = (acc[def.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.handlers.clear();
    this.versionedHandlers.clear();
    this.latestVersions.clear();
  }
}

