/**
 * ComponentCSSPreview - Preview for component CSS phase
 *
 * Shows component categories and streaming progress during generation.
 */

import React from "react";

interface ComponentCSSPreviewProps {
  data: {
    cssLength?: number;
    generating?: boolean;
    charCount?: number;
    lineCount?: number;
    preview?: string;
  };
}

const COMPONENT_CATEGORIES = [
  { name: "Layout", items: ["cards", "grids", "stacks", "dividers"] },
  { name: "Forms", items: ["inputs", "selects", "checkboxes", "switches"] },
  { name: "Buttons", items: ["primary", "secondary", "ghost", "danger"] },
  { name: "Feedback", items: ["badges", "alerts", "progress", "ratings"] },
  { name: "Data", items: ["tables", "lists", "metrics", "charts"] },
];

export const ComponentCSSPreview: React.FC<ComponentCSSPreviewProps> = ({
  data,
}) => {
  const isGenerating = data?.generating && !data?.cssLength;
  const hasProgress = isGenerating && data?.charCount;

  return (
    <div className="space-y-4">
      {/* Progress indicator during generation */}
      {hasProgress ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-dark-400">
              {Math.round((data.charCount || 0) / 1024)}KB
            </span>
            <span className="text-dark-500">•</span>
            <span className="text-dark-400">
              {data.lineCount} lines
            </span>
            <span className="ml-auto">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            </span>
          </div>
          {/* CSS preview snippet */}
          {data.preview && (
            <pre className="bg-dark-900 rounded-md p-3 text-xs text-dark-400 font-mono overflow-hidden max-h-32">
              <code>{data.preview}</code>
            </pre>
          )}
        </div>
      ) : (
        <p className="text-dark-400 text-sm">
          {data?.cssLength
            ? `Generated ${Math.round(data.cssLength / 1024)}KB of component styles.`
            : "Generating custom CSS for 130+ component classes based on your design direction."}
        </p>
      )}

      {/* Component categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {COMPONENT_CATEGORIES.map((category) => (
          <div key={category.name} className="space-y-1">
            <div className="text-dark-300 text-sm font-medium">
              {category.name}
            </div>
            <div className="text-dark-500 text-xs">
              {category.items.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
