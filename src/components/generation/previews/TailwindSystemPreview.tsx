/**
 * TailwindSystemPreview - Preview for Tailwind system phase
 *
 * Shows generated palettes, role mappings, and overlap resolutions.
 */

import React from "react";

interface TailwindSystemPreviewProps {
  data: {
    paletteNames?: string[];
    overlaps?: Array<{
      role: string;
      mappedTo: string;
      conflictedWith: string;
    }>;
    roleMapping?: Record<string, string>;
  };
}

export const TailwindSystemPreview: React.FC<TailwindSystemPreviewProps> = ({
  data,
}) => (
  <div className="space-y-4">
    {data.paletteNames && (
      <div className="space-y-2">
        <div className="text-dark-400 text-sm">Generated Palettes</div>
        <div className="flex flex-wrap gap-2">
          {data.paletteNames.map((name: string) => (
            <span
              key={name}
              className="px-2 py-1 bg-dark-700 rounded text-sm font-mono text-dark-200"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    )}
    {data.overlaps && data.overlaps.length > 0 && (
      <div className="space-y-2">
        <div className="text-amber-400 text-sm">Color Overlaps Resolved</div>
        <div className="space-y-1">
          {data.overlaps.map((overlap, i: number) => (
            <div key={i} className="text-xs text-dark-400">
              {overlap.role}: mapped to {overlap.mappedTo} (conflict with{" "}
              {overlap.conflictedWith})
            </div>
          ))}
        </div>
      </div>
    )}
    {data.roleMapping && (
      <div className="grid grid-cols-3 gap-2 text-xs">
        {Object.entries(data.roleMapping)
          .slice(0, 6)
          .map(([role, palette]) => (
            <div key={role} className="flex justify-between">
              <span className="text-dark-500">{role}</span>
              <span className="font-mono text-dark-300">{palette as string}</span>
            </div>
          ))}
      </div>
    )}
  </div>
);
