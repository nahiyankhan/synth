/**
 * VisualDirectionPreview - Preview for visual direction phase
 *
 * Shows brand identity, traits, design principles, visual references, and more.
 */

import React from "react";

interface VisualDirectionPreviewProps {
  data: {
    name?: string;
    coreMessage?: string;
    summary?: string;
    direction?: string;
    traits?: string[];
    designPrinciples?: string[];
    visualReferences?: string[];
    emotionalResonance?: string[];
    aestheticPreferences?: string[];
    voiceTone?: string;
  };
}

export const VisualDirectionPreview: React.FC<VisualDirectionPreviewProps> = ({
  data,
}) => (
  <div className="space-y-6">
    {/* Header: Name + Core Message */}
    <div className="space-y-2">
      {data.name && (
        <h4 className="text-xl font-semibold text-dark-50">{data.name}</h4>
      )}
      {data.coreMessage && (
        <p className="text-dark-300 italic">"{data.coreMessage}"</p>
      )}
    </div>

    {/* Summary + Direction */}
    {(data.summary || data.direction) && (
      <div className="space-y-2">
        {data.summary && (
          <p className="text-dark-300 text-sm">{data.summary}</p>
        )}
        {data.direction && (
          <p className="text-dark-400 text-sm">{data.direction}</p>
        )}
      </div>
    )}

    {/* Two-column layout for traits and principles */}
    <div className="grid grid-cols-2 gap-6">
      {/* Traits */}
      {data.traits && data.traits.length > 0 && (
        <div className="space-y-2">
          <div className="text-dark-400 text-xs uppercase tracking-wide">
            Traits
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.traits.map((trait: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-dark-700 rounded text-sm text-dark-200"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Design Principles */}
      {data.designPrinciples && data.designPrinciples.length > 0 && (
        <div className="space-y-2">
          <div className="text-dark-400 text-xs uppercase tracking-wide">
            Design Principles
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.designPrinciples.map((principle: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-dark-700 rounded text-sm text-dark-200"
              >
                {principle}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Three-column layout for references, emotions, aesthetics */}
    <div className="grid grid-cols-3 gap-4">
      {/* Visual References */}
      {data.visualReferences && data.visualReferences.length > 0 && (
        <div className="space-y-2">
          <div className="text-dark-400 text-xs uppercase tracking-wide">
            Visual References
          </div>
          <ul className="space-y-1">
            {data.visualReferences.map((ref: string, i: number) => (
              <li key={i} className="text-sm text-dark-300">
                {ref}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emotional Resonance */}
      {data.emotionalResonance && data.emotionalResonance.length > 0 && (
        <div className="space-y-2">
          <div className="text-dark-400 text-xs uppercase tracking-wide">
            Emotional Goals
          </div>
          <ul className="space-y-1">
            {data.emotionalResonance.map((emotion: string, i: number) => (
              <li key={i} className="text-sm text-dark-300">
                {emotion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aesthetic Preferences */}
      {data.aestheticPreferences && data.aestheticPreferences.length > 0 && (
        <div className="space-y-2">
          <div className="text-dark-400 text-xs uppercase tracking-wide">
            Aesthetic Direction
          </div>
          <ul className="space-y-1">
            {data.aestheticPreferences.map((pref: string, i: number) => (
              <li key={i} className="text-sm text-dark-300">
                {pref}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* Voice & Tone */}
    {data.voiceTone && (
      <div className="space-y-2">
        <div className="text-dark-400 text-xs uppercase tracking-wide">
          Voice & Tone
        </div>
        <p className="text-sm text-dark-300">{data.voiceTone}</p>
      </div>
    )}
  </div>
);
