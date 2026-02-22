/**
 * TypographyAnalysisView - Visual feedback for typography tools
 * Displays type scale analysis, readability checks, hierarchy suggestions, etc.
 */

import React from 'react';
import {
  TypeScaleAnalysisResult,
  ReadabilityAnalysisResult,
  TypeHierarchyResult,
  LetterSpacingAnalysisResult
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

const TrendingUp: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

interface TypographyAnalysisViewProps {
  data: any;
  toolName: string;
  onClose: () => void;
}

export const TypographyAnalysisView: React.FC<TypographyAnalysisViewProps> = ({
  data,
  toolName,
  onClose
}) => {
  // Route to appropriate component based on tool name
  switch (toolName) {
    case 'analyze_type_scale':
      return <TypeScaleView data={data as TypeScaleAnalysisResult} onClose={onClose} />;
    
    case 'check_readability':
      return <ReadabilityView data={data as ReadabilityAnalysisResult} onClose={onClose} />;
    
    case 'suggest_type_hierarchy':
      return <TypeHierarchyView data={data as TypeHierarchyResult} onClose={onClose} />;
    
    case 'analyze_letter_spacing':
      return <LetterSpacingView data={data as LetterSpacingAnalysisResult} onClose={onClose} />;
    
    default:
      return <div>Unknown typography tool: {toolName}</div>;
  }
};

/**
 * Type Scale Analysis View
 */
const TypeScaleView: React.FC<{
  data: TypeScaleAnalysisResult;
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
            Type Scale Analysis
          </h2>
          <p className="text-gray-600">
            {data.ratioName ? `Detected: ${data.ratioName} (${data.detectedRatio?.toFixed(3)})` : 'No clear ratio detected'}
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
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Adherence Score</p>
            <p className={`text-4xl font-bold ${getScoreColor(data.adherenceScore)}`}>
              {data.adherenceScore}%
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-blue-500" />
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

      {/* Sizes Analysis */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Size Tokens
        </h3>
        <div className="space-y-2">
          {data.sizes.map((size, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-mono text-sm text-gray-900">{size.token}</p>
                <p className="text-xs text-gray-500">
                  {size.size}px
                  {size.expectedSize && ` (expected: ${size.expectedSize.toFixed(1)}px)`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {size.deviation < 5 ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : size.deviation < 10 ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {size.deviation.toFixed(1)}% deviation
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      {data.gaps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Missing Sizes
          </h3>
          <div className="space-y-2">
            {data.gaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Gap detected:</span> Between{' '}
                  <code className="px-1 py-0.5 bg-white rounded">{gap.between[0]}</code>
                  {' and '}
                  <code className="px-1 py-0.5 bg-white rounded">{gap.between[1]}</code>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Suggested: <code className="px-1 py-0.5 bg-white rounded">{gap.suggestedToken}</code>
                  {' at '}{gap.expectedSize}px
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
 * Readability Analysis View
 */
const ReadabilityView: React.FC<{
  data: ReadabilityAnalysisResult;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const getStatusBadge = (status: string) => {
    const styles = {
      optimal: 'bg-green-100 text-green-800',
      acceptable: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.poor;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Readability Analysis
          </h2>
          <p className="text-gray-600">
            Line-height to font-size ratios
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
            <p className="text-sm text-gray-600 mb-1">Overall Score</p>
            <p className="text-4xl font-bold text-green-600">{data.overallScore}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Summary</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.summary.optimal} optimal, {data.summary.acceptable} acceptable, {data.summary.needsImprovement} need improvement
            </p>
          </div>
        </div>
      </div>

      {/* Issues */}
      {data.issues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Issues Found ({data.issues.length})
          </h3>
          <div className="space-y-3">
            {data.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  issue.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${issue.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {issue.token}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {issue.problem}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 italic">
                      💡 {issue.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Tokens */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          All Typography Tokens ({data.tokens.length})
        </h3>
        <div className="space-y-2">
          {data.tokens.map((token, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-mono text-sm text-gray-900">{token.token}</p>
                <p className="text-xs text-gray-500">
                  {token.fontSize}px / {token.lineHeight.toFixed(1)}px = {token.ratio.toFixed(2)} ({token.context})
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(token.status)}`}>
                {token.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Type Hierarchy View
 */
const TypeHierarchyView: React.FC<{
  data: TypeHierarchyResult;
  onClose: () => void;
}> = ({ data, onClose }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Type Hierarchy Analysis
          </h2>
          <p className="text-gray-600">
            {data.detectedScale.ratioName} scale ({data.detectedScale.ratio.toFixed(3)})
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Completeness Score */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Completeness</p>
            <p className="text-4xl font-bold text-purple-600">{data.completenessScore}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Coverage</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.currentLevels.length} of {data.currentLevels.length + data.missingLevels.length} levels
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
                className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg"
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

      {/* Current Levels */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Current Hierarchy Levels
        </h3>
        <div className="space-y-2">
          {data.currentLevels.map((level, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900 uppercase text-sm">
                  {level.level}
                </span>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-gray-900">{level.token}</p>
                <p className="text-xs text-gray-500">{level.size}px</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Levels */}
      {data.missingLevels.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Missing Levels ({data.missingLevels.length})
          </h3>
          <div className="space-y-3">
            {data.missingLevels.map((level, idx) => (
              <div
                key={idx}
                className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase text-sm mb-1">
                      {level.level}
                    </p>
                    <p className="text-sm text-gray-700">
                      Suggested: <code className="px-1 py-0.5 bg-white rounded">{level.suggestedToken}</code>
                      {' at '}<strong>{level.suggestedSize}px</strong>
                    </p>
                    <p className="text-xs text-gray-600 mt-2 italic">
                      {level.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Letter Spacing Analysis View
 */
const LetterSpacingView: React.FC<{
  data: LetterSpacingAnalysisResult;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      display: 'bg-purple-100 text-purple-800',
      heading: 'bg-blue-100 text-blue-800',
      body: 'bg-green-100 text-green-800',
      small: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category as keyof typeof colors] || colors.body;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'optimal') return <Check className="w-5 h-5 text-green-600" />;
    if (status === 'acceptable') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <X className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Letter Spacing Analysis
          </h2>
          <p className="text-gray-600">
            Tracking recommendations by size category
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Optimal</p>
            <p className="text-2xl font-bold text-green-600">{data.summary.optimal}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Needs Negative</p>
            <p className="text-2xl font-bold text-blue-600">{data.summary.needsNegativeTracking}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Needs Positive</p>
            <p className="text-2xl font-bold text-purple-600">{data.summary.needsPositiveTracking}</p>
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

      {/* Token Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Token Analysis ({data.tokens.length})
        </h3>
        <div className="space-y-3">
          {data.tokens.map((token, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-mono text-sm text-gray-900">{token.token}</p>
                  <p className="text-xs text-gray-500">
                    {token.fontSize}px
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(token.sizeCategory)}`}>
                    {token.sizeCategory}
                  </span>
                  {getStatusIcon(token.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-600">Current Tracking</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {token.currentTracking !== null ? `${token.currentTracking}em` : 'None set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Recommended</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {token.recommendedTracking}em
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3 italic">
                {token.reasoning}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

