/**
 * ContrastValidationPreview - Preview for contrast validation phase
 *
 * Shows validation results, auto-fixes, and any issues requiring manual review.
 */

import React from "react";

interface ContrastValidationPreviewProps {
  data: {
    valid?: boolean;
    fixCount?: number;
    unfixableCount?: number;
    fixes?: Array<{
      selector: string;
      change: string;
    }>;
    unfixable?: Array<unknown>;
  } | null;
}

export const ContrastValidationPreview: React.FC<
  ContrastValidationPreviewProps
> = ({ data }) => {
  if (!data) return null;

  const isValid = data.valid;
  const fixCount = data.fixCount || data.fixes?.length || 0;
  const unfixableCount = data.unfixableCount || data.unfixable?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${isValid ? "bg-green-500" : "bg-amber-500"}`}
        />
        <span
          className={`font-medium ${isValid ? "text-green-400" : "text-amber-400"}`}
        >
          {isValid ? "All contrast checks passed" : "Contrast issues found"}
        </span>
      </div>

      {fixCount > 0 && (
        <div className="space-y-2">
          <div className="text-dark-400 text-sm">
            Auto-fixed {fixCount} contrast {fixCount === 1 ? "issue" : "issues"}{" "}
            for WCAG AA compliance
          </div>
          {data.fixes && data.fixes.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.fixes.slice(0, 5).map((fix, i: number) => (
                <div key={i} className="text-xs text-dark-500 font-mono">
                  {fix.selector}: {fix.change}
                </div>
              ))}
              {data.fixes.length > 5 && (
                <div className="text-xs text-dark-500">
                  +{data.fixes.length - 5} more fixes
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {unfixableCount > 0 && (
        <div className="text-amber-400 text-sm">
          {unfixableCount} {unfixableCount === 1 ? "issue" : "issues"} require
          manual review
        </div>
      )}

      {fixCount === 0 && unfixableCount === 0 && isValid && (
        <p className="text-dark-400 text-sm">
          All color combinations meet WCAG AA contrast requirements (4.5:1 for
          text).
        </p>
      )}
    </div>
  );
};
