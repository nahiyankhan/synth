/**
 * Tool Handlers Index
 * Exports all handlers and provides a function to create a registry
 */

import { ToolRegistry } from '../../core/ToolRegistry';
import { StyleGraph } from '../../core/StyleGraph';

// Query handlers
export { GetTokenHandler } from './query/GetTokenHandler';
export { SearchTokensHandler } from './query/SearchTokensHandler';
export { FindAllReferencesHandler } from './query/FindAllReferencesHandler';

// Modify handlers
export { UpdateTokenHandler } from './modify/UpdateTokenHandler';
export { CreateTokenHandler } from './modify/CreateTokenHandler';
export { DeleteTokenHandler } from './modify/DeleteTokenHandler';
export { RenameTokenHandler } from './modify/RenameTokenHandler';
export { FindAndReplaceHandler } from './modify/FindAndReplaceHandler';

// Analyze handlers
export { GetImpactAnalysisHandler } from './analyze/GetImpactAnalysisHandler';
export { GetSystemStatsHandler } from './analyze/GetSystemStatsHandler';
export { AnalyzeDesignSystemHandler } from './analyze/AnalyzeDesignSystemHandler';
export { SuggestColorsForGapsHandler } from './analyze/SuggestColorsForGapsHandler';

// Create handlers
export { GenerateColorScaleHandler } from './create/GenerateColorScaleHandler';

// History handlers
export { UndoChangeHandler } from './history/UndoChangeHandler';
export { RedoChangeHandler } from './history/RedoChangeHandler';

// Export handlers
export { ExportDesignSystemHandler } from './export/ExportDesignSystemHandler';
export { ExportTailwindConfigHandler } from './export/ExportTailwindConfigHandler';

// Import handlers for registry creation
import { GetTokenHandler } from './query/GetTokenHandler';
import { SearchTokensHandler } from './query/SearchTokensHandler';
import { FindAllReferencesHandler } from './query/FindAllReferencesHandler';
import { UpdateTokenHandler } from './modify/UpdateTokenHandler';
import { CreateTokenHandler } from './modify/CreateTokenHandler';
import { DeleteTokenHandler } from './modify/DeleteTokenHandler';
import { RenameTokenHandler } from './modify/RenameTokenHandler';
import { FindAndReplaceHandler } from './modify/FindAndReplaceHandler';
import { GetImpactAnalysisHandler } from './analyze/GetImpactAnalysisHandler';
import { GetSystemStatsHandler } from './analyze/GetSystemStatsHandler';
import { AnalyzeDesignSystemHandler } from './analyze/AnalyzeDesignSystemHandler';
import { SuggestColorsForGapsHandler } from './analyze/SuggestColorsForGapsHandler';
import { GenerateColorScaleHandler } from './create/GenerateColorScaleHandler';
import { UndoChangeHandler } from './history/UndoChangeHandler';
import { RedoChangeHandler } from './history/RedoChangeHandler';
import { ExportDesignSystemHandler } from './export/ExportDesignSystemHandler';
import { ExportTailwindConfigHandler } from './export/ExportTailwindConfigHandler';

/**
 * Create a ToolRegistry with all native handlers registered
 */
export function createToolRegistry(graph: StyleGraph): ToolRegistry {
  const registry = new ToolRegistry();

  // Register query handlers
  registry.register(new GetTokenHandler(graph));
  registry.register(new SearchTokensHandler(graph));
  registry.register(new FindAllReferencesHandler(graph));

  // Register modify handlers
  registry.register(new UpdateTokenHandler(graph));
  registry.register(new CreateTokenHandler(graph));
  registry.register(new DeleteTokenHandler(graph));
  registry.register(new RenameTokenHandler(graph));
  registry.register(new FindAndReplaceHandler(graph));

  // Register analyze handlers
  registry.register(new GetImpactAnalysisHandler(graph));
  registry.register(new GetSystemStatsHandler(graph));
  registry.register(new AnalyzeDesignSystemHandler(graph));
  registry.register(new SuggestColorsForGapsHandler(graph));

  // Register create handlers
  registry.register(new GenerateColorScaleHandler(graph));

  // Register history handlers
  registry.register(new UndoChangeHandler(graph));
  registry.register(new RedoChangeHandler(graph));

  // Register export handlers
  registry.register(new ExportDesignSystemHandler(graph));
  registry.register(new ExportTailwindConfigHandler(graph));

  return registry;
}

/**
 * Get all native handler classes
 * Useful for testing or custom registration
 */
export const NATIVE_HANDLERS = [
  // Query
  GetTokenHandler,
  SearchTokensHandler,
  FindAllReferencesHandler,
  // Modify
  UpdateTokenHandler,
  CreateTokenHandler,
  DeleteTokenHandler,
  RenameTokenHandler,
  FindAndReplaceHandler,
  // Analyze
  GetImpactAnalysisHandler,
  GetSystemStatsHandler,
  AnalyzeDesignSystemHandler,
  SuggestColorsForGapsHandler,
  // Create
  GenerateColorScaleHandler,
  // History
  UndoChangeHandler,
  RedoChangeHandler,
  // Export
  ExportDesignSystemHandler,
  ExportTailwindConfigHandler,
] as const;
