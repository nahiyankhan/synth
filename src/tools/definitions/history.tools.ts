/**
 * History Tool Definitions
 * Operations for managing change history (undo/redo)
 */

import { ToolDefinition } from '@/types/toolRegistry';

export const UNDO_CHANGE_TOOL: ToolDefinition = {
  name: 'undoChange',
  version: '1.0.0',
  category: 'history',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Undo the last change made to the design language',
  parameters: {},
  returns: 'Success confirmation with details of undone change',
  sideEffects: 'Reverts last modification',
  defer_loading: false,
};

export const REDO_CHANGE_TOOL: ToolDefinition = {
  name: 'redoChange',
  version: '1.0.0',
  category: 'history',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Redo a previously undone change',
  parameters: {},
  returns: 'Success confirmation with details of redone change',
  sideEffects: 'Re-applies previously undone modification',
  defer_loading: false,
};

export const HISTORY_TOOLS = [
  UNDO_CHANGE_TOOL,
  REDO_CHANGE_TOOL,
];

