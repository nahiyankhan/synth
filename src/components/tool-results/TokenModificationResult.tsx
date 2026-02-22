import React from 'react';
import { TokenModificationResult as ModificationResult } from '@/types/toolUI';
import { ToolResultHeader } from './ToolResultHeader';

interface TokenModificationResultProps {
  result: ModificationResult;
  onClose: () => void;
}

export const TokenModificationResult: React.FC<TokenModificationResultProps> = ({ 
  result,
  onClose 
}) => {
  const getOperationIcon = () => {
    switch (result.operation) {
      case 'create':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'delete':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      case 'rename':
        return (
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        );
    }
  };

  const getOperationColor = () => {
    switch (result.operation) {
      case 'create': return 'text-green-600';
      case 'update': return 'text-blue-600';
      case 'delete': return 'text-red-600';
      case 'rename': return 'text-purple-600';
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'string' && value.startsWith('#')) {
      return (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border border-dark-200"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono text-sm">{value}</span>
        </div>
      );
    }
    return <span className="font-mono text-sm">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <ToolResultHeader
        title={`token ${result.operation}`}
        subtitle={new Date(result.timestamp).toLocaleTimeString()}
        onClose={onClose}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success/Error Status */}
          <div className="flex items-start gap-4">
            {getOperationIcon()}
            <div className="flex-1">
              <h3 className={`text-lg font-light ${getOperationColor()} mb-1`}>
                {result.success ? 'Success' : 'Failed'}
              </h3>
              {result.message && (
                <p className="text-sm text-dark-600 font-light">{result.message}</p>
              )}
            </div>
          </div>

          {/* Token Path */}
          {result.operation === 'rename' ? (
            <div className="bg-dark-50 rounded-lg p-4">
              <div className="text-xs text-dark-500 uppercase tracking-wide mb-2 font-light">
                path renamed
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs text-dark-500 mb-1 font-light">from</div>
                  <div className="font-mono text-sm text-dark-600 line-through">{result.oldPath}</div>
                </div>
                <svg className="w-4 h-4 text-dark-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="flex-1">
                  <div className="text-xs text-dark-500 mb-1 font-light">to</div>
                  <div className="font-mono text-sm text-dark-900">{result.path}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-50 rounded-lg p-4">
              <div className="text-xs text-dark-500 uppercase tracking-wide mb-2 font-light">
                token path
              </div>
              <div className="font-mono text-sm text-[#1A1A1A]">{result.path}</div>
            </div>
          )}

          {/* Value Change */}
          {result.operation !== 'delete' && (result.oldValue || result.newValue) && (
            <div className="bg-dark-50 rounded-lg p-4">
              <div className="text-xs text-dark-500 uppercase tracking-wide mb-3 font-light">
                value {result.operation === 'update' ? 'change' : ''}
              </div>
              
              {result.operation === 'update' && result.oldValue && (
                <div className="mb-3 pb-3 border-b border-dark-200">
                  <div className="text-xs text-dark-500 mb-1.5 font-light">before</div>
                  {formatValue(result.oldValue)}
                </div>
              )}
              
              {result.newValue && (
                <div>
                  <div className="text-xs text-dark-500 mb-1.5 font-light">
                    {result.operation === 'update' ? 'after' : 'value'}
                  </div>
                  {formatValue(result.newValue)}
                </div>
              )}
            </div>
          )}

          {/* Impact */}
          {result.affectedDependents !== undefined && result.affectedDependents > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-light text-amber-900 mb-1">
                    impact on dependents
                  </div>
                  <div className="text-sm text-amber-700">
                    This change affects <span className="font-mono font-medium">{result.affectedDependents}</span> dependent token{result.affectedDependents !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
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

