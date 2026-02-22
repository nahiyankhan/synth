/**
 * AnalyzeDesignSystem Handler
 * Comprehensive data scientist-style analysis of the design system
 */

import { ToolHandler } from '@/core/ToolHandler';
import { ANALYZE_DESIGN_SYSTEM_TOOL } from '@/tools/definitions/analyze.tools';
import { AnalyzeDesignSystemParams, AnalyzeDesignSystemParamsSchema } from '@/tools/schemas/analyze.schemas';
import { StyleGraph } from '@/core/StyleGraph';

interface AnalysisInsights {
  executiveSummary: string;
  topRecommendations: string[];
  riskAssessment: string;
  healthScore: number;
  estimatedImpact: string;
}

interface DesignSystemAnalysis {
  timestamp: number;
  category: string;
  summary: {
    totalTokens: number;
    coreTokens: number;
    specs: number;
    issuesFound: number;
    opportunitiesFound: number;
  };
  usage?: any;
  redundancy?: any;
  health?: any;
  optimization?: any;
  insights: AnalysisInsights;
}

export class AnalyzeDesignSystemHandler extends ToolHandler<AnalyzeDesignSystemParams, DesignSystemAnalysis> {
  constructor(private graph: StyleGraph) {
    super(ANALYZE_DESIGN_SYSTEM_TOOL);
  }

  protected validate(params: unknown): AnalyzeDesignSystemParams {
    return AnalyzeDesignSystemParamsSchema.parse(params);
  }

  protected async handle(params: AnalyzeDesignSystemParams): Promise<DesignSystemAnalysis> {
    const category = params.category || 'all';
    const timestamp = Date.now();

    // Get base stats
    const stats = this.graph.getStats();

    // Initialize result object
    const analysis: DesignSystemAnalysis = {
      timestamp,
      category,
      summary: {
        totalTokens: stats.totalNodes,
        coreTokens: stats.coreTokensCount,
        specs: stats.specsCount,
        issuesFound: 0,
        opportunitiesFound: 0,
      },
      insights: {
        executiveSummary: '',
        topRecommendations: [],
        riskAssessment: '',
        healthScore: 100,
        estimatedImpact: '',
      },
    };

    // USAGE ANALYSIS
    if (category === 'all' || category === 'usage') {
      const usageDistribution = this.graph.findUsageDistribution();
      const orphanedTokens = this.graph.findOrphanedTokens();

      // Filter by layer/type if specified
      let filteredOrphaned = orphanedTokens;
      if (params.layer) {
        filteredOrphaned = filteredOrphaned.filter((t) => t.layer === params.layer);
      }
      if (params.type) {
        filteredOrphaned = filteredOrphaned.filter((t) => t.type === params.type);
      }

      // Get most/least used tokens
      const allTokensWithUsage = Array.from(this.graph.nodes.values())
        .filter((n) => !n.metadata?.isSpec)
        .map((n) => ({
          path: n.id,
          layer: n.layer,
          type: n.type,
          dependentCount: n.dependents.size,
          isSpec: n.metadata?.isSpec || false,
        }));

      // Filter by params
      let filteredTokens = allTokensWithUsage;
      if (params.layer) {
        filteredTokens = filteredTokens.filter((t) => t.layer === params.layer);
      }
      if (params.type) {
        filteredTokens = filteredTokens.filter((t) => t.type === params.type);
      }

      const sortedByUsage = [...filteredTokens].sort(
        (a, b) => b.dependentCount - a.dependentCount
      );

      analysis.usage = {
        mostUsedSpecs: sortedByUsage.filter((t) => t.isSpec).slice(0, 10),
        leastUsedSpecs: sortedByUsage.filter((t) => t.isSpec).slice(-10).reverse(),
        mostUsedTokens: sortedByUsage.slice(0, 10),
        orphanedTokens: filteredOrphaned,
        usageDistribution: usageDistribution.map((d) => ({
          range: d.range,
          count: d.count,
        })),
      };

      analysis.summary.issuesFound += filteredOrphaned.length;
    }

    // REDUNDANCY ANALYSIS
    if (category === 'all' || category === 'redundancy') {
      const similarColors = this.graph.findSimilarColors(10);
      const similarNumeric = this.graph.findSimilarNumericValues(10, 2);
      const semanticDuplicates = this.graph.findSemanticDuplicates();

      // Filter by layer/type
      let filteredDuplicates = semanticDuplicates;
      if (params.layer) {
        filteredDuplicates = filteredDuplicates.filter((d) => d.layer === params.layer);
      }
      if (params.type) {
        filteredDuplicates = filteredDuplicates.filter((d) => d.type === params.type);
      }

      analysis.redundancy = {
        similarColors: params.type && params.type !== 'color' ? [] : similarColors,
        similarNumericValues: params.type === 'color' ? [] : similarNumeric,
        semanticDuplicates: filteredDuplicates,
        totalRedundancies:
          similarColors.length + similarNumeric.length + filteredDuplicates.length,
      };

      analysis.summary.issuesFound += analysis.redundancy.totalRedundancies;
    }

    // HEALTH ANALYSIS
    if (category === 'all' || category === 'health') {
      // Find deprecated tokens still in use
      const deprecatedInUse = Array.from(this.graph.nodes.values())
        .filter((n) => n.metadata?.deprecated && n.dependents.size > 0)
        .map((n) => ({
          path: n.id,
          dependentCount: n.dependents.size,
          dependents: Array.from(n.dependents).map((id) => {
            const dep = this.graph.getNode(id);
            return dep ? dep.id : id;
          }),
        }));

      // Find broken references
      const brokenReferences: Array<{ path: string; brokenRef: string }> = [];
      for (const node of this.graph.nodes.values()) {
        const errors = this.graph.validateNode(node.id);
        for (const error of errors) {
          if (error.type === 'broken-reference') {
            brokenReferences.push({
              path: node.id,
              brokenRef: error.message,
            });
          }
        }
      }

      const circularDeps = this.graph.findCircularDependencies();

      analysis.health = {
        deprecatedInUse,
        brokenReferences,
        circularDependencies: circularDeps,
      };

      analysis.summary.issuesFound +=
        deprecatedInUse.length + brokenReferences.length + circularDeps.length;
    }

    // OPTIMIZATION ANALYSIS
    if (category === 'all' || category === 'optimization') {
      const semanticDuplicates = this.graph.findSemanticDuplicates();
      const optimizationOps = this.graph.findOptimizationOpportunities();
      const orphanedTokens = this.graph.findOrphanedTokens();

      // Filter unused utilities
      const unusedUtilities = orphanedTokens.filter((t) => t.layer === 'utility');

      // Filter by params
      let filteredOps = optimizationOps;
      if (params.layer) {
        filteredOps = filteredOps.filter((op) => {
          const node = this.graph.getNode(op.path);
          return node && node.layer === params.layer;
        });
      }
      if (params.type) {
        filteredOps = filteredOps.filter((op) => {
          const node = this.graph.getNode(op.path);
          return node && node.type === params.type;
        });
      }

      const potentialReduction = semanticDuplicates.reduce(
        (sum, dup) => sum + (dup.tokens.length - 1),
        0
      );

      analysis.optimization = {
        consolidationCandidates: semanticDuplicates,
        primitiveToReferenceOpportunities: filteredOps,
        unusedUtilities,
        estimatedReduction: {
          tokens: potentialReduction + unusedUtilities.length,
          percentage: Math.round(
            ((potentialReduction + unusedUtilities.length) / stats.totalNodes) * 100
          ),
        },
      };

      analysis.summary.opportunitiesFound = filteredOps.length + unusedUtilities.length;
    }

    // GENERATE NARRATIVE INSIGHTS
    analysis.insights = this.generateNarrativeInsights(analysis, stats);

    return analysis;
  }

  private generateNarrativeInsights(analysis: DesignSystemAnalysis, stats: any): AnalysisInsights {
    const insights: AnalysisInsights = {
      executiveSummary: '',
      topRecommendations: [],
      riskAssessment: '',
      healthScore: 100,
      estimatedImpact: '',
    };

    // Calculate health score (0-100)
    let healthScore = 100;

    if (analysis.health) {
      healthScore -= analysis.health.deprecatedInUse.length * 5;
      healthScore -= analysis.health.brokenReferences.length * 10;
      healthScore -= analysis.health.circularDependencies.length * 15;
    }

    if (analysis.redundancy) {
      healthScore -= Math.min(analysis.redundancy.totalRedundancies * 0.5, 20);
    }

    if (analysis.usage) {
      healthScore -= Math.min(analysis.usage.orphanedTokens.length * 0.5, 10);
    }

    insights.healthScore = Math.max(0, Math.round(healthScore));

    // Executive Summary
    const summaryParts = [];
    summaryParts.push(
      `Your design system contains ${stats.coreTokensCount} core tokens (${stats.byLayer.primitive} primitives, ${stats.byLayer.utility} utilities) and ${stats.specsCount} composite specs.`
    );

    if (insights.healthScore >= 80) {
      summaryParts.push(`Overall health is strong (${insights.healthScore}/100).`);
    } else if (insights.healthScore >= 60) {
      summaryParts.push(
        `Overall health is moderate (${insights.healthScore}/100) with room for improvement.`
      );
    } else {
      summaryParts.push(`Overall health needs attention (${insights.healthScore}/100).`);
    }

    insights.executiveSummary = summaryParts.join(' ');

    // Top Recommendations
    if (analysis.health) {
      if (analysis.health.brokenReferences.length > 0) {
        insights.topRecommendations.push(
          `Fix ${analysis.health.brokenReferences.length} broken reference${
            analysis.health.brokenReferences.length > 1 ? 's' : ''
          } immediately to prevent design inconsistencies.`
        );
      }

      if (analysis.health.circularDependencies.length > 0) {
        insights.topRecommendations.push(
          `Resolve ${analysis.health.circularDependencies.length} circular ${
            analysis.health.circularDependencies.length > 1 ? 'dependencies' : 'dependency'
          } - these prevent proper token resolution.`
        );
      }
    }

    if (analysis.redundancy && analysis.redundancy.semanticDuplicates.length > 0) {
      insights.topRecommendations.push(
        `Consolidate ${analysis.redundancy.semanticDuplicates.length} sets of duplicate tokens.`
      );
    }

    if (analysis.usage && analysis.usage.orphanedTokens.length > 5) {
      insights.topRecommendations.push(
        `Clean up ${analysis.usage.orphanedTokens.length} orphaned tokens to reduce clutter.`
      );
    }

    if (insights.topRecommendations.length === 0) {
      insights.topRecommendations.push(
        `Design system is well-maintained! Continue monitoring for redundancies as it grows.`
      );
    }

    // Limit to top 5 recommendations
    insights.topRecommendations = insights.topRecommendations.slice(0, 5);

    // Risk Assessment
    const risks = [];

    if (analysis.health) {
      if (
        analysis.health.brokenReferences.length > 0 ||
        analysis.health.circularDependencies.length > 0
      ) {
        risks.push('High risk: Critical errors present that break token resolution.');
      }
    }

    if (analysis.redundancy && analysis.redundancy.totalRedundancies > 20) {
      risks.push(
        'Medium risk: High redundancy makes maintenance difficult and increases chance of inconsistencies.'
      );
    }

    if (risks.length === 0) {
      insights.riskAssessment =
        'Low risk: No critical issues detected. Design system is stable and well-maintained.';
    } else {
      insights.riskAssessment = risks.join(' ');
    }

    // Estimated Impact
    if (analysis.optimization) {
      const reduction = analysis.optimization.estimatedReduction;
      if (reduction.tokens > 0) {
        insights.estimatedImpact = `Implementing suggested optimizations could reduce token count by ${reduction.tokens} tokens (${reduction.percentage}%), improving maintainability.`;
      } else {
        insights.estimatedImpact =
          'Design system is lean and well-optimized. Focus on maintaining current quality as it scales.';
      }
    } else {
      insights.estimatedImpact = 'Run full analysis to estimate optimization impact.';
    }

    return insights;
  }

  protected getSuccessMessage(params: AnalyzeDesignSystemParams, result: DesignSystemAnalysis): string {
    return `Analysis complete: Found ${result.summary.issuesFound} issues and ${result.summary.opportunitiesFound} optimization opportunities`;
  }
}
