/**
 * Tool Plugin System
 * Allows dynamic registration of custom tools
 */

import { ToolRegistry } from './ToolRegistry';
import { ToolContext } from './ToolContext';

/**
 * Plugin interface that all plugins must implement
 */
export interface ToolPlugin {
  /**
   * Unique plugin identifier
   */
  name: string;

  /**
   * Semantic version
   */
  version: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Initialize the plugin (called once when loaded)
   */
  initialize?(context: ToolContext): void;

  /**
   * Register tools provided by this plugin
   */
  registerTools(registry: ToolRegistry): void;

  /**
   * Optional cleanup when plugin is unloaded
   */
  cleanup?(): void;
}

/**
 * Plugin loader and manager
 */
export class PluginLoader {
  private plugins = new Map<string, ToolPlugin>();
  private initialized = new Set<string>();

  /**
   * Load a plugin
   */
  loadPlugin(plugin: ToolPlugin, context: ToolContext): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already loaded`);
    }

    // Initialize if the plugin has an initialize method
    if (plugin.initialize) {
      plugin.initialize(context);
    }

    // Register tools
    plugin.registerTools(context.registry);

    // Track plugin
    this.plugins.set(plugin.name, plugin);
    this.initialized.add(plugin.name);
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }

    // Cleanup if the plugin has a cleanup method
    if (plugin.cleanup) {
      plugin.cleanup();
    }

    this.plugins.delete(pluginName);
    this.initialized.delete(pluginName);
  }

  /**
   * Check if a plugin is loaded
   */
  isLoaded(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): ToolPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): ToolPlugin | null {
    return this.plugins.get(name) || null;
  }
}

