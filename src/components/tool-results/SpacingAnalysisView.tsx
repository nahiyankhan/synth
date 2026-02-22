/**
 * SpacingAnalysisView - Visual feedback for spacing/size tools
 * Displays spacing scale analysis, consistency checks, token suggestions, etc.
 */

import React from 'react';
import {
  SpacingScaleAnalysisResult,
  SpacingConsistencyResult,
  SpacingTokenSuggestionsResult,
  SizeHarmonyResult
} from '../../types/visualFeedback';

// Simple SVG icons
const Check: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertTriangle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const X: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Grid: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
);

const Plus: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

interface SpacingAnalysisViewProps {
  data: any;
  toolName: string;
  onClose: () => void;
}

export const SpacingAnalysisView: React.FC<SpacingAnalysisViewProps> = ({
  data,
  toolName,
  onClose
}) => {
  // Route to appropriate component based on tool name
  switch (toolName) {
    case 'analyze_spacing_scale':
      return <SpacingScaleView data={data as SpacingScaleAnalysisResult} onClose={onClose} />;
    
    case 'check_spacing_consistency':
      return <SpacingConsistencyView data={data as SpacingConsistencyResult} onClose={onClose} />;
    
    case 'suggest_spacing_tokens':
      return <SpacingTokenSuggestionsView data={data as SpacingTokenSuggestionsResult} onClose={onClose} />;
    
    case 'validate_size_harmony':
      return <SizeHarmonyView data={data as SizeHarmonyResult} onClose={onClose} />;
    
    default:
      return <div>Unknown spacing tool: {toolName}</div>;
  }
};

/**
 * Spacing Scale Analysis View
 */
const SpacingScaleView: React.FC<{
  data: SpacingScaleAnalysisResult;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Spacing Scale Analysis
          </h2>
          <p className="text-gray-600">
            {data.detectedBase ? `Detected: ${data.detectedBase}px base unit` : 'No base unit detected'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Grid Adherence</p>
            <p className={`text-4xl font-bold ${getScoreColor(data.adherenceScore)}`}>
              {data.adherenceScore}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Grid Status</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.scaleVisualization.onGrid} on-grid, {data.scaleVisualization.offGrid} off-grid
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recommendations
          </h3>
          <div className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
              >
                <span className="text-lg">{rec.startsWith('✅') ? '✅' : rec.startsWith('⚠️') ? '⚠️' : '❌'}</span>
                <p className="text-gray-700 text-sm flex-1">
                  {rec.replace(/^[✅⚠️❌]\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Values Analysis */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Spacing Values ({data.values.length})
        </h3>
        <div className="space-y-2">
          {data.values.map((value, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                value.isOnGrid
                  ? 'bg-green-50 hover:bg-green-100'
                  : 'bg-red-50 hover:bg-red-100'
              }`}
            >
              <div>
                <p className="font-mono text-sm text-gray-900">{value.token}</p>
                <p className="text-xs text-gray-500">
                  {value.value}px
                  {value.expectedValue && ` (expected: ${value.expectedValue}px)`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {value.isOnGrid ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <>
                    <span className="text-sm text-red-600">
                      {value.deviation.toFixed(1)}px off
                    </span>
                    <X className="w-5 h-5 text-red-600" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      {data.gaps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Missing Values ({data.gaps.length})
          </h3>
          <div className="space-y-2">
            {data.gaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <p className="text-sm text-gray-700 font-semibold">
                  {gap.value}px - <code className="px-1 py-0.5 bg-white rounded">{gap.suggestedToken}</code>
                </p>
                <p className="text-xs text-gray-600 mt-1">{gap.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Spacing Consistency View
 */
const SpacingConsistencyView: React.FC<{
  data: SpacingConsistencyResult;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const getSeverityBadge = (severity: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return styles[severity as keyof typeof styles] || styles.low;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Spacing Consistency Analysis
          </h2>
          <p className="text-gray-600">
            Grid adherence and pattern analysis
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Consistency Score</p>
            <p className="text-4xl font-bold text-green-600">{data.overallScore}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Summary</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.summary.onGrid} on-grid, {data.summary.offGrid} off-grid, {data.summary.redundant} redundant
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recommendations
          </h3>
          <div className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg"
              >
                <span className="text-lg">{rec.startsWith('✅') ? '✅' : '💡'}</span>
                <p className="text-gray-700 text-sm flex-1">
                  {rec.replace(/^[✅💡]\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Off-Grid Values */}
      {data.offGridValues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Off-Grid Values ({data.offGridValues.length})
          </h3>
          <div className="space-y-2">
            {data.offGridValues.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-gray-900">{item.token}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.value}px (nearest grid: {item.nearestGrid}px, {item.deviation.toFixed(1)}px off)
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redundant Values */}
      {data.redundantValues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Redundant Values ({data.redundantValues.length})
          </h3>
          <div className="space-y-2">
            {data.redundantValues.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <p className="text-sm text-gray-700">
                  <code className="px-1 py-0.5 bg-white rounded">{item.tokens.join(', ')}</code>
                  {' '}({item.value}px) is only {item.distance}px away from{' '}
                  <code className="px-1 py-0.5 bg-white rounded">{item.tooCloseTo}</code>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern Breaks */}
      {data.patternBreaks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Pattern Breaks ({data.patternBreaks.length})
          </h3>
          <div className="space-y-2">
            {data.patternBreaks.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <p className="font-mono text-sm text-gray-900 mb-1">{item.token}</p>
                <p className="text-xs text-gray-600">
                  {item.value}px - {item.issue}
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Expected: {item.expectedPattern}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Spacing Token Suggestions View
 */
const SpacingTokenSuggestionsView: React.FC<{
  data: SpacingTokenSuggestionsResult;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return styles[priority as keyof typeof styles] || styles.low;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Spacing Token Suggestions
          </h2>
          <p className="text-gray-600">
            Based on {data.detectedBase}px grid
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Coverage Analysis */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Coverage by Size Range</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Micro', value: data.coverage.micro, range: '0-8px' },
            { label: 'Small', value: data.coverage.small, range: '8-16px' },
            { label: 'Medium', value: data.coverage.medium, range: '16-32px' },
            { label: 'Large', value: data.coverage.large, range: '32-64px' },
            { label: 'XLarge', value: data.coverage.xlarge, range: '64px+' },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <p className="text-2xl font-bold text-purple-600">{item.value}</p>
              <p className="text-xs text-gray-600">{item.label}</p>
              <p className="text-xs text-gray-500">{item.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recommendations
          </h3>
          <div className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg"
              >
                <span className="text-lg">{rec.startsWith('✅') ? '✅' : '💡'}</span>
                <p className="text-gray-700 text-sm flex-1">
                  {rec.replace(/^[✅💡]\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Suggested Tokens ({data.suggestions.length})
          </h3>
          <div className="space-y-3">
            {data.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-mono text-sm text-gray-900 font-semibold">
                        {suggestion.suggestedToken}
                      </p>
                      <p className="text-xs text-gray-500">{suggestion.value}px</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{suggestion.reasoning}</p>
                <p className="text-xs text-gray-600 italic">
                  Use case: {suggestion.useCase}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Size Harmony View
 */
const SizeHarmonyView: React.FC<{
  data: SizeHarmonyResult;
  onClose: () => void;
}> = ({ data, onClose }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Size Harmony Analysis
          </h2>
          <p className="text-gray-600">
            {data.harmonicProgression.detected
              ? `Harmonic progression detected (ratio: ${data.harmonicProgression.ratio?.toFixed(2)})`
              : 'No clear harmonic progression'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Harmony Score */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Ratio Consistency</p>
            <p className="text-4xl font-bold text-indigo-600">{data.ratioConsistency}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Adherence</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.harmonicProgression.adherenceScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recommendations
          </h3>
          <div className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg"
              >
                <span className="text-lg">{rec.startsWith('✅') ? '✅' : rec.startsWith('⚠️') ? '⚠️' : '❌'}</span>
                <p className="text-gray-700 text-sm flex-1">
                  {rec.replace(/^[✅⚠️❌]\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Size Tokens ({data.sizes.length})
        </h3>
        <div className="space-y-2">
          {data.sizes.map((size, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                size.isHarmonic
                  ? 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              <div>
                <p className="font-mono text-sm text-gray-900">{size.token}</p>
                <p className="text-xs text-gray-500">
                  {size.value}px - {size.category}
                  {size.ratio && ` (ratio: ${size.ratio.toFixed(2)})`}
                </p>
              </div>
              {size.isHarmonic && <Check className="w-5 h-5 text-green-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Outliers */}
      {data.outliers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Outliers ({data.outliers.length})
          </h3>
          <div className="space-y-3">
            {data.outliers.map((outlier, idx) => (
              <div
                key={idx}
                className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <p className="font-mono text-sm text-gray-900 font-semibold mb-1">
                  {outlier.token} ({outlier.value}px)
                </p>
                <p className="text-sm text-gray-700 mb-2">{outlier.issue}</p>
                <p className="text-xs text-gray-600 italic">
                  💡 {outlier.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

