import React from 'react';
import { ImpactAnalysisResult } from '../../types/aiTools';
import { ToolResultHeader } from './ToolResultHeader';

interface ImpactAnalysisViewProps {
  result: ImpactAnalysisResult;
  onClose: () => void;
}

export const ImpactAnalysisView: React.FC<ImpactAnalysisViewProps> = ({ 
  result,
  onClose 
}) => {
  return (
    <div className="flex flex-col h-full">
      <ToolResultHeader
        title="impact analysis"
        subtitle={result.path}
        subtitleMono
        onClose={onClose}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-light text-blue-900 mb-1">
                {result.directDependents}
              </div>
              <div className="text-xs text-blue-700 font-light">
                direct dependents
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-2xl font-light text-purple-900 mb-1">
                {result.totalAffected}
              </div>
              <div className="text-xs text-purple-700 font-light">
                total affected
              </div>
            </div>

            <div className={`rounded-lg p-4 border ${
              result.wouldBreak 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className={`text-2xl font-light mb-1 ${
                result.wouldBreak ? 'text-red-900' : 'text-green-900'
              }`}>
                {result.wouldBreak ? 'yes' : 'no'}
              </div>
              <div className={`text-xs font-light ${
                result.wouldBreak ? 'text-red-700' : 'text-green-700'
              }`}>
                would break
              </div>
            </div>
          </div>

          {/* Warning if would break */}
          {result.wouldBreak && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-light text-red-900 mb-1">
                    breaking change warning
                  </div>
                  <div className="text-sm text-red-700">
                    Modifying or deleting this token would break dependent tokens. Review the affected tokens carefully before proceeding.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Affected Utilities */}
          {result.affectedUtilities.length > 0 && (
            <div className="bg-dark-50 rounded-lg p-4">
              <h3 className="text-sm font-light text-dark-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                affected utility tokens ({result.affectedUtilities.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.affectedUtilities.map((token, idx) => (
                  <div 
                    key={idx}
                    className="font-mono text-xs text-dark-700 bg-white px-3 py-2 rounded border border-dark-200"
                  >
                    {token}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected Composites */}
          {result.affectedComposites.length > 0 && (
            <div className="bg-dark-50 rounded-lg p-4">
              <h3 className="text-sm font-light text-dark-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                affected composite tokens ({result.affectedComposites.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.affectedComposites.map((token, idx) => (
                  <div 
                    key={idx}
                    className="font-mono text-xs text-dark-700 bg-white px-3 py-2 rounded border border-dark-200"
                  >
                    {token}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Impact */}
          {result.directDependents === 0 && result.totalAffected === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-light text-green-900 mb-1">
                no dependencies
              </h3>
              <p className="text-sm text-green-700">
                This token is not referenced by any other tokens. Safe to modify or delete.
              </p>
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

