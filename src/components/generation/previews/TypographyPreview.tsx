/**
 * TypographyPreview - Preview for typography phase
 *
 * Shows font sizes and scale information.
 */

import React from "react";

interface TypographyPreviewProps {
  data: {
    fontSizes?: Record<string, string>;
    scale?: {
      ratio?: string | number;
      base?: string;
    };
  } | null;
}

export const TypographyPreview: React.FC<TypographyPreviewProps> = ({
  data,
}) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Font Sizes */}
        {data.fontSizes && (
          <div className="space-y-2">
            <div className="text-dark-400 text-xs uppercase tracking-wide">
              Font Sizes
            </div>
            <div className="space-y-1">
              {Object.entries(data.fontSizes)
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-dark-500">{key}</span>
                    <span className="font-mono text-dark-300">
                      {value as string}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Scale Info */}
        {data.scale && (
          <div className="space-y-2">
            <div className="text-dark-400 text-xs uppercase tracking-wide">
              Scale
            </div>
            <div className="space-y-1">
              {data.scale.ratio && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Ratio</span>
                  <span className="font-mono text-dark-300">
                    {data.scale.ratio}
                  </span>
                </div>
              )}
              {data.scale.base && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Base</span>
                  <span className="font-mono text-dark-300">
                    {data.scale.base}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
