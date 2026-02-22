/**
 * Identity Preview Component
 * Displays the brand identity phase output
 */

import React from 'react';
import { SectionHeader } from '../ui/section-header';

interface IdentityData {
  traits?: string[];
  voiceTone?: string;
  visualReferences?: string[];
  designPrinciples?: string[];
  emotionalResonance?: string[];
  aestheticPreferences?: string[];
}

interface IdentityPreviewProps {
  data: IdentityData;
}

export const IdentityPreview: React.FC<IdentityPreviewProps> = ({ data }) => {
  return (
    <div className="space-y-4">

      {data.traits && data.traits.length > 0 && (
        <div className="mb-4">
          <SectionHeader>Personality Traits</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {data.traits.map((trait, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.voiceTone && (
        <div className="mb-4">
          <SectionHeader spacing="sm">Voice & Tone</SectionHeader>
          <p className="text-sm text-dark-200 leading-relaxed">{data.voiceTone}</p>
        </div>
      )}

      {data.designPrinciples && data.designPrinciples.length > 0 && (
        <div className="mb-4">
          <SectionHeader>Design Principles</SectionHeader>
          <ul className="space-y-1.5">
            {data.designPrinciples.map((principle, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-purple-400 font-bold mt-0.5">{i + 1}.</span>
                <span className="text-dark-200">{principle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.aestheticPreferences && data.aestheticPreferences.length > 0 && (
        <div className="mb-4">
          <SectionHeader>Aesthetic Direction</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {data.aestheticPreferences.map((pref, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-dark-700 text-dark-200 rounded text-xs"
              >
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.emotionalResonance && data.emotionalResonance.length > 0 && (
        <div>
          <SectionHeader spacing="sm">Emotional Goals</SectionHeader>
          <p className="text-sm text-dark-200">{data.emotionalResonance.join(', ')}</p>
        </div>
      )}
    </div>
  );
};
