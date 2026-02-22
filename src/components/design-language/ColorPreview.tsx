/**
 * Color Preview Component
 * Displays the color palette phase output
 */

import React from "react";

interface ColorData {
  baseColors?: Record<string, string>;
  semanticRoles?: {
    primary?: string;
    accent?: string;
    surface?: string;
    background?: string;
    text?: string;
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  };
  reasoning?: string;
}

interface ColorPreviewProps {
  data: ColorData;
}

export const ColorPreview: React.FC<ColorPreviewProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      {data.baseColors && Object.keys(data.baseColors).length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-dark-400 uppercase mb-2">
            Base Colors
          </h4>
          <div className="space-y-3">
            {Object.entries(data.baseColors).map(([name, hex]) => (
              <div key={name}>
                <p className="text-xs font-medium text-dark-200 capitalize mb-1.5">
                  {name.replace(/-/g, " ")}
                </p>
                <div className="flex gap-0.5">
                  <div
                    className="flex-1 h-12 rounded border border-dark-600"
                    style={{ backgroundColor: hex }}
                    title={hex.toUpperCase()}
                  />
                </div>
                <p className="text-xs text-dark-300 font-mono mt-1">
                  {hex.toUpperCase()}
                </p>
                <p className="text-xs text-dark-500 mt-0.5">
                  Generates 50-900 scale
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.semanticRoles && Object.keys(data.semanticRoles).length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-dark-400 uppercase mb-2">
            Semantic Roles
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(data.semanticRoles)
              .filter(([_, value]) => value)
              .map(([role, colorName]) => {
                const hex = data.baseColors?.[colorName];
                return (
                  <div
                    key={role}
                    className="flex items-center gap-2 p-1.5 rounded bg-dark-700"
                  >
                    {hex && (
                      <div
                        className="w-5 h-5 rounded border border-dark-500 flex-shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-dark-200 capitalize truncate">
                        {role}
                      </p>
                      <p className="text-xs text-dark-400 truncate">
                        {colorName}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {data.reasoning && (
        <div className="p-3 bg-dark-700 rounded">
          <h4 className="text-xs font-semibold text-dark-400 uppercase mb-1">
            Strategy
          </h4>
          <p className="text-sm text-dark-200 leading-relaxed">
            {data.reasoning}
          </p>
        </div>
      )}
    </div>
  );
};
