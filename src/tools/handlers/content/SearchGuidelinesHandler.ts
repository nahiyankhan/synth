/**
 * SearchGuidelines Handler
 * Searches voice & tone guidelines using semantic search
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { SEARCH_GUIDELINES_TOOL } from '../../definitions/content.tools';
import { SearchGuidelinesParams, SearchGuidelinesParamsSchema } from '../../schemas/content.schemas';
import { auditText } from '../../../services/textAuditService';
import { ContentSearchResult } from '../../../types/content';
import { getContentByType, getAllContent } from '../../../services/contentService';

export interface SearchGuidelinesResult {
  guidelines: ContentSearchResult[];
  total: number;
  query: string;
  type: string;
}

export class SearchGuidelinesHandler extends ToolHandler<SearchGuidelinesParams, SearchGuidelinesResult> {
  constructor() {
    super(SEARCH_GUIDELINES_TOOL);
  }

  protected validate(params: unknown): SearchGuidelinesParams {
    return SearchGuidelinesParamsSchema.parse(params);
  }

  protected async handle(params: SearchGuidelinesParams): Promise<SearchGuidelinesResult> {
    const topK = params.topK || 5;
    const type = params.type || 'all';

    // Use audit text service to get semantic matches
    const result = await auditText(params.query, topK);

    if (result.error) {
      throw new Error(result.error);
    }

    // Filter by type if specified
    let filteredMatches = result.matches;
    if (type !== 'all') {
      filteredMatches = result.matches.filter(m => m.metadata.type === type);
    }

    return {
      guidelines: filteredMatches,
      total: filteredMatches.length,
      query: params.query,
      type,
    };
  }

  protected getSuccessMessage(params: SearchGuidelinesParams, result: SearchGuidelinesResult): string {
    const typeStr = params.type && params.type !== 'all' ? ` (type: ${params.type})` : '';
    return `Found ${result.total} guidelines matching "${params.query}"${typeStr}.`;
  }
}

