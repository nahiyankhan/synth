/**
 * Validation Schemas Index
 * Maps tool names to their validation schemas
 */

import { z } from 'zod';
import * as QuerySchemas from './query.schemas';
import * as ModifySchemas from './modify.schemas';

/**
 * Map of tool names to their Zod validation schemas
 */
export const TOOL_SCHEMAS = new Map<string, z.ZodSchema>([
  // Query tools
  ['getToken', QuerySchemas.GetTokenParamsSchema],
  ['searchTokens', QuerySchemas.SearchTokensParamsSchema],
  ['findAllReferences', QuerySchemas.FindAllReferencesParamsSchema],

  // Modify tools
  ['createToken', ModifySchemas.CreateTokenParamsSchema],
  ['updateToken', ModifySchemas.UpdateTokenParamsSchema],
  ['deleteToken', ModifySchemas.DeleteTokenParamsSchema],
  ['renameToken', ModifySchemas.RenameTokenParamsSchema],
  ['findAndReplace', ModifySchemas.FindAndReplaceParamsSchema],
]);

export * from './query.schemas';
export * from './modify.schemas';

