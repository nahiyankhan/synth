import React, { useState } from 'react';
import { DesignSystemAnalysis } from '../../types/aiTools';
import { ToolResultHeader } from './ToolResultHeader';

interface SystemAnalysisViewProps {
  result: DesignSystemAnalysis;
  onClose: () => void;
}

export const SystemAnalysisView: React.FC<SystemAnalysisViewProps> = ({ 
  result,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'redundancy' | 'health' | 'optimization'>('overview');

  const tabs = [
    { id: 'overview', label: 'overview' },
    { id: 'usage', label: 'usage', show: !!result.usage },
    { id: 'redundancy', label: 'redundancy', show: !!result.redundancy },
    { id: 'health', label: 'health', show: !!result.health },
    { id: 'optimization', label: 'optimization', show: !!result.optimization },
  ].filter(tab => tab.show !== false);

  const healthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const healthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="flex flex-col h-full">
      <ToolResultHeader
        title="design system analysis"
        subtitle={`${result.category} · ${new Date(result.timestamp).toLocaleString()}`}
        onClose={onClose}
      />

      {/* Tabs */}
      <div className="border-b border-dark-200 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-light transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-dark-900 text-dark-900'
                  : 'border-transparent text-dark-500 hover:text-dark-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Health Score */}
              <div className={`rounded-lg p-6 border ${healthScoreBg(result.insights.healthScore)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-light text-dark-900">health score</h3>
                  <div className={`text-4xl font-light ${healthScoreColor(result.insights.healthScore)}`}>
                    {result.insights.healthScore}/100
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      result.insights.healthScore >= 80 ? 'bg-green-600' :
                      result.insights.healthScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${result.insights.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-50 rounded-lg p-4 border border-dark-200">
                  <div className="text-2xl font-light text-dark-900 mb-1">
                    {result.summary.totalTokens}
                  </div>
                  <div className="text-xs text-dark-600 font-light">total tokens</div>
                </div>
                <div className="bg-dark-50 rounded-lg p-4 border border-dark-200">
                  <div className="text-2xl font-light text-dark-900 mb-1">
                    {result.summary.coreTokens}
                  </div>
                  <div className="text-xs text-dark-600 font-light">core tokens</div>
                </div>
                <div className="bg-dark-50 rounded-lg p-4 border border-dark-200">
                  <div className="text-2xl font-light text-dark-900 mb-1">
                    {result.summary.specs}
                  </div>
                  <div className="text-xs text-dark-600 font-light">specs</div>
                </div>
                <div className="bg-dark-50 rounded-lg p-4 border border-dark-200">
                  <div className="text-2xl font-light text-dark-900 mb-1">
                    {result.summary.issuesFound}
                  </div>
                  <div className="text-xs text-dark-600 font-light">issues found</div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-light text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  executive summary
                </h3>
                <p className="text-sm text-blue-900 leading-relaxed font-light">
                  {result.insights.executiveSummary}
                </p>
              </div>

              {/* Top Recommendations */}
              {result.insights.topRecommendations.length > 0 && (
                <div className="bg-dark-50 rounded-lg p-4">
                  <h3 className="text-sm font-light text-dark-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    top recommendations
                  </h3>
                  <ul className="space-y-2">
                    {result.insights.topRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-dark-700">
                        <span className="text-dark-400 font-mono text-xs mt-0.5">{idx + 1}.</span>
                        <span className="font-light">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Assessment */}
              {result.insights.riskAssessment && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-light text-amber-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    risk assessment
                  </h3>
                  <p className="text-sm text-amber-900 leading-relaxed font-light">
                    {result.insights.riskAssessment}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'usage' && result.usage && (
            <div className="space-y-6">
              <h3 className="text-base font-light text-dark-900">usage analysis</h3>
              
              {/* Most Used */}
              {result.usage.mostUsedTokens.length > 0 && (
                <div className="bg-dark-50 rounded-lg p-4">
                  <h4 className="text-sm font-light text-dark-900 mb-3">most used tokens</h4>
                  <div className="space-y-2">
                    {result.usage.mostUsedTokens.slice(0, 10).map((token, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-dark-200">
                        <span className="font-mono text-xs text-dark-700">{token.path}</span>
                        <span className="text-xs text-dark-500">{token.dependentCount} refs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orphaned */}
              {result.usage.orphanedTokens.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="text-sm font-light text-amber-900 mb-3">
                    orphaned tokens ({result.usage.orphanedTokens.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.usage.orphanedTokens.map((token, idx) => (
                      <div key={idx} className="bg-white px-3 py-2 rounded border border-amber-200">
                        <div className="font-mono text-xs text-dark-700 mb-1">{token.path}</div>
                        <div className="text-xs text-dark-500">{token.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'redundancy' && result.redundancy && (
            <div className="space-y-6">
              <h3 className="text-base font-light text-dark-900">
                redundancy analysis · {result.redundancy.totalRedundancies} found
              </h3>
              
              {/* Semantic Duplicates */}
              {result.redundancy.semanticDuplicates.length > 0 && (
                <div className="bg-dark-50 rounded-lg p-4">
                  <h4 className="text-sm font-light text-dark-900 mb-3">
                    semantic duplicates ({result.redundancy.semanticDuplicates.length})
                  </h4>
                  <div className="space-y-3">
                    {result.redundancy.semanticDuplicates.slice(0, 10).map((dup, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-dark-200">
                        <div className="text-xs text-dark-500 mb-2">
                          {dup.tokens.length} tokens resolve to: <span className="font-mono">{String(dup.resolvedValue)}</span>
                        </div>
                        <div className="space-y-1">
                          {dup.tokens.map((token, tidx) => (
                            <div key={tidx} className="font-mono text-xs text-dark-700">{token}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'health' && result.health && (
            <div className="space-y-6">
              <h3 className="text-base font-light text-dark-900">health check</h3>
              
              {/* Broken References */}
              {result.health.brokenReferences.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="text-sm font-light text-red-900 mb-3">
                    broken references ({result.health.brokenReferences.length})
                  </h4>
                  <div className="space-y-2">
                    {result.health.brokenReferences.map((broken, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-red-200">
                        <div className="font-mono text-xs text-dark-700 mb-1">{broken.path}</div>
                        <div className="text-xs text-red-700">references: {broken.brokenRef}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Good */}
              {result.health.brokenReferences.length === 0 && 
               result.health.circularDependencies.length === 0 && (
                <div className="bg-green-50 rounded-lg p-8 text-center border border-green-200">
                  <svg className="w-12 h-12 mx-auto text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-base font-light text-green-900 mb-1">all clear</h4>
                  <p className="text-sm text-green-700">No health issues detected</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimization' && result.optimization && (
            <div className="space-y-6">
              <h3 className="text-base font-light text-dark-900">optimization opportunities</h3>
              
              {result.optimization.estimatedReduction && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-light text-blue-900 mb-2">estimated reduction</h4>
                  <div className="text-2xl font-light text-blue-900">
                    {result.optimization.estimatedReduction.tokens} tokens ({result.optimization.estimatedReduction.percentage}%)
                  </div>
                </div>
              )}

              {/* Consolidation Candidates */}
              {result.optimization.consolidationCandidates.length > 0 && (
                <div className="bg-dark-50 rounded-lg p-4">
                  <h4 className="text-sm font-light text-dark-900 mb-3">
                    consolidation candidates ({result.optimization.consolidationCandidates.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {result.optimization.consolidationCandidates.map((cand, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-dark-200">
                        <div className="text-xs text-dark-500 mb-2">
                          {cand.tokens.length} tokens → <span className="font-mono">{String(cand.resolvedValue)}</span>
                        </div>
                        <div className="space-y-1">
                          {cand.tokens.slice(0, 5).map((token, tidx) => (
                            <div key={tidx} className="font-mono text-xs text-dark-700">{token}</div>
                          ))}
                          {cand.tokens.length > 5 && (
                            <div className="text-xs text-dark-400">... and {cand.tokens.length - 5} more</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-dark-200 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-800 transition-colors text-sm font-light"
        >
          close
        </button>
      </div>
    </div>
  );
};

