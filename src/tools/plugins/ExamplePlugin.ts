/**
 * Example Plugin
 * Demonstrates how to create a custom tool plugin
 */

import { ToolPlugin } from '../../core/ToolPlugin';
import { ToolRegistry } from '../../core/ToolRegistry';
import { ToolContext } from '../../core/ToolContext';
import { ToolHandler } from '../../core/ToolHandler';
import { ToolDefinition } from '../../types/toolRegistry';

/**
 * Example custom tool definition
 */
const CUSTOM_METRIC_TOOL: ToolDefinition = {
  name: 'getCustomMetric',
  version: '1.0.0',
  category: 'analyze',
  description: 'Example custom tool that computes a custom metric',
  parameters: {
    metricName: {
      type: 'string',
      required: true,
      description: 'Name of the metric to compute',
    },
  },
  returns: 'Custom metric value',
  defer_loading: false,
};

/**
 * Example custom handler
 */
class CustomMetricHandler extends ToolHandler {
  constructor() {
    super(CUSTOM_METRIC_TOOL);
  }

  protected validate(params: unknown): any {
    if (!params || typeof params !== 'object' || !('metricName' in params)) {
      throw new Error('metricName is required');
    }
    return params;
  }

  protected async handle(params: any): Promise<any> {
    // Custom logic here
    return {
      metric: params.metricName,
      value: Math.random() * 100,
      timestamp: Date.now(),
    };
  }
}

/**
 * Example plugin implementation
 */
export class ExamplePlugin implements ToolPlugin {
  name = 'example-plugin';
  version = '1.0.0';
  description = 'Example plugin demonstrating custom tool registration';

  initialize(context: ToolContext): void {
    console.log('Example plugin initialized!');
    console.log('Graph has', context.getGraph().getStats().totalNodes, 'tokens');
  }

  registerTools(registry: ToolRegistry): void {
    // Register custom tools
    registry.register(new CustomMetricHandler());
    
    console.log('Example plugin registered custom tools');
  }

  cleanup(): void {
    console.log('Example plugin cleaned up');
  }
}

