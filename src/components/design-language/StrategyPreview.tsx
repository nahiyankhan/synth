/**
 * Strategy Preview Component
 * Displays the design strategy phase output
 */

import React from 'react';
import { SectionHeader } from '@/components/ui/section-header';

interface StrategyData {
  summary?: string;
  analysis?: {
    industry?: string;
    audience?: string;
    keyInsights?: string[];
  };
  recommendation?: {
    coreMessage?: string;
    direction?: string;
    reasoning?: string;
  };
}

interface StrategyPreviewProps {
  data: StrategyData;
}

export const StrategyPreview: React.FC<StrategyPreviewProps> = ({ data }) => {
  return (
    <div className="space-y-4">

      {data.summary && (
        <div className="mb-4">
          <p className="text-sm text-dark-200 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {data.recommendation?.coreMessage && (
        <div className="mb-4">
          <SectionHeader spacing="sm">Core Message</SectionHeader>
          <p className="text-sm text-dark-100">{data.recommendation.coreMessage}</p>
        </div>
      )}

      {data.analysis && (
        <div className="space-y-3">
          {data.analysis.audience && (
            <div>
              <SectionHeader spacing="sm">Target Audience</SectionHeader>
              <p className="text-sm text-dark-200">{data.analysis.audience}</p>
            </div>
          )}

          {data.analysis.industry && (
            <div>
              <SectionHeader spacing="sm">Industry Context</SectionHeader>
              <p className="text-sm text-dark-200">{data.analysis.industry}</p>
            </div>
          )}

          {data.analysis.keyInsights && data.analysis.keyInsights.length > 0 && (
            <div>
              <SectionHeader spacing="sm">Key Insights</SectionHeader>
              <ul className="space-y-1">
                {data.analysis.keyInsights.map((insight, i) => (
                  <li key={i} className="text-sm text-dark-200 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.recommendation?.direction && (
        <div>
          <SectionHeader spacing="sm">Strategic Direction</SectionHeader>
          <p className="text-sm text-dark-200">{data.recommendation.direction}</p>
        </div>
      )}
    </div>
  );
};
