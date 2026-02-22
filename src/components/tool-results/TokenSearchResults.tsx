import React, { useState } from 'react';
import { SearchResult, TokenInfo } from '../../types/aiTools';
import { ToolResultHeader } from './ToolResultHeader';

interface TokenSearchResultsProps {
  result: SearchResult;
  onSelectToken?: (token: TokenInfo) => void;
  onClose: () => void;
}

export const TokenSearchResults: React.FC<TokenSearchResultsProps> = ({ 
  result, 
  onSelectToken,
  onClose 
}) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const layers = ['all', ...Array.from(new Set(result.tokens.map(t => t.layer)))];
  const types = ['all', ...Array.from(new Set(result.tokens.map(t => t.type)))];

  const filteredTokens = result.tokens.filter(token => {
    const matchesLayer = selectedLayer === 'all' || token.layer === selectedLayer;
    const matchesType = selectedType === 'all' || token.type === selectedType;
    return matchesLayer && matchesType;
  });

  const getValueDisplay = (token: TokenInfo) => {
    if (token.type === 'color') {
      return token.resolvedLight || token.value;
    }
    return String(token.value);
  };

  return (
    <div className="flex flex-col h-full">
      <ToolResultHeader
        title="search results"
        subtitle={
          <>
            {filteredTokens.length} of {result.total} tokens
            {result.query && <span> · query: <span className="font-mono text-xs">{result.query}</span></span>}
          </>
        }
        onClose={onClose}
      />

      {/* Filters */}
      <div className="px-6 py-3 border-b border-dark-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-500 font-light">layer:</span>
          <div className="flex gap-1.5">
            {layers.map(layer => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`px-2.5 py-1 rounded text-xs font-light transition-colors ${
                  selectedLayer === layer
                    ? 'bg-dark-900 text-white'
                    : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-500 font-light">type:</span>
          <div className="flex gap-1.5">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded text-xs font-light transition-colors ${
                  selectedType === type
                    ? 'bg-dark-900 text-white'
                    : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredTokens.map((token, idx) => (
            <button
              key={`${token.path}-${idx}`}
              onClick={() => onSelectToken?.(token)}
              className="w-full text-left p-3 bg-white border border-dark-200 rounded-lg hover:border-dark-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-dark-900 mb-1.5 truncate">
                    {token.path}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-dark-100 text-dark-600 text-xs rounded font-light">
                      {token.layer}
                    </span>
                    <span className="px-2 py-0.5 bg-dark-100 text-dark-600 text-xs rounded font-light">
                      {token.type}
                    </span>
                    {token.isSpec && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-light">
                        spec
                      </span>
                    )}
                    {token.dependents.length > 0 && (
                      <span className="text-xs text-dark-400 font-light">
                        {token.dependents.length} dependent{token.dependents.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {token.type === 'color' && (
                    <div 
                      className="w-8 h-8 rounded border border-dark-200 shadow-sm"
                      style={{ backgroundColor: getValueDisplay(token) }}
                      title={getValueDisplay(token)}
                    />
                  )}
                  <div className="text-xs text-dark-500 font-mono max-w-[100px] truncate">
                    {getValueDisplay(token)}
                  </div>
                  <svg 
                    className="w-4 h-4 text-dark-300 group-hover:text-dark-400 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-dark-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-dark-400 font-light">no tokens match the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

