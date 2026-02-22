import { StyleGraph } from '../core/StyleGraph';
import { StyleNode } from '../types/styleGraph';
import { vi } from 'vitest';

/**
 * Create a mock StyleGraph for testing
 */
export function createMockGraph(): StyleGraph {
  const graph = new StyleGraph();

  // Add some primitive tokens
  // Note: 'name' is required for VirtualFileSystem to generate token paths
  graph.createNode({
    id: 'base.color.blue.500',
    name: 'base.color.blue.500',
    path: ['base', 'color', 'blue', '500'],
    layer: 'primitive',
    type: 'color',
    value: '#3B82F6',
  });

  graph.createNode({
    id: 'base.color.red.500',
    name: 'base.color.red.500',
    path: ['base', 'color', 'red', '500'],
    layer: 'primitive',
    type: 'color',
    value: '#EF4444',
  });

  graph.createNode({
    id: 'base.spacing.medium',
    name: 'base.spacing.medium',
    path: ['base', 'spacing', 'medium'],
    layer: 'primitive',
    type: 'size',
    value: 16,
  });

  // Add utility tokens
  graph.createNode({
    id: 'semantic.color.primary',
    name: 'semantic.color.primary',
    path: ['semantic', 'color', 'primary'],
    layer: 'utility',
    type: 'color',
    value: '{base.color.blue.500}',
  });

  graph.createNode({
    id: 'semantic.color.error',
    name: 'semantic.color.error',
    path: ['semantic', 'color', 'error'],
    layer: 'utility',
    type: 'color',
    value: '{base.color.red.500}',
  });

  return graph;
}

/**
 * Create a mock node for testing
 */
export function createMockNode(overrides: Partial<StyleNode> = {}): StyleNode {
  return {
    id: 'test.node',
    path: ['test', 'node'],
    name: 'node',
    layer: 'primitive',
    type: 'color',
    value: '#000000',
    dependencies: new Set(),
    dependents: new Set(),
    metadata: {},
    ...overrides,
  };
}

/**
 * Mock session promise ref for tool call tests
 */
export function createMockSessionPromiseRef() {
  const mockSession = {
    sendToolResponse: vi.fn(),
  };
  
  return {
    current: Promise.resolve(mockSession),
  };
}

/**
 * Mock function call for tool tests
 */
export function createMockFunctionCall(name: string, args: any = {}) {
  return {
    id: 'test-call-id',
    name,
    args,
  };
}

