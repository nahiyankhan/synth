/**
 * AuditText Handler
 * Audits user text against voice & tone guidelines using semantic similarity
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { AUDIT_TEXT_TOOL } from '../../definitions/content.tools';
import { AuditTextParams, AuditTextParamsSchema } from '../../schemas/content.schemas';
import { auditText } from '../../../services/textAuditService';
import { ContentSearchResult } from '../../../types/content';

export interface AuditTextResult {
  matches: ContentSearchResult[];
  summary: string;
  totalMatches: number;
  averageScore: number;
  assessment: 'strong' | 'moderate' | 'weak' | 'none';
}

export class AuditTextHandler extends ToolHandler<AuditTextParams, AuditTextResult> {
  constructor() {
    super(AUDIT_TEXT_TOOL);
  }

  protected validate(params: unknown): AuditTextParams {
    return AuditTextParamsSchema.parse(params);
  }

  protected async handle(params: AuditTextParams): Promise<AuditTextResult> {
    const topK = params.topK || 5;
    const result = await auditText(params.text, topK);

    if (result.error) {
      throw new Error(result.error);
    }

    // Calculate average score
    const averageScore = result.matches.length > 0
      ? result.matches.reduce((sum, m) => sum + m.score, 0) / result.matches.length
      : 0;

    // Determine assessment level
    let assessment: 'strong' | 'moderate' | 'weak' | 'none';
    if (result.matches.length === 0) {
      assessment = 'none';
    } else if (averageScore > 0.7) {
      assessment = 'strong';
    } else if (averageScore > 0.5) {
      assessment = 'moderate';
    } else {
      assessment = 'weak';
    }

    return {
      matches: result.matches,
      summary: result.summary,
      totalMatches: result.matches.length,
      averageScore,
      assessment,
    };
  }

  protected getSuccessMessage(params: AuditTextParams, result: AuditTextResult): string {
    const wordCount = params.text.trim().split(/\s+/).length;
    return `Audited ${wordCount} words against ${result.totalMatches} relevant guidelines. Assessment: ${result.assessment} alignment (${Math.round(result.averageScore * 100)}% average match).`;
  }
}

