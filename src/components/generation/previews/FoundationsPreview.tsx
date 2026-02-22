/**
 * FoundationsPreview - Preview for foundations phase
 *
 * Shows typography scale and shadow settings.
 */

import React from "react";

interface FoundationsPreviewProps {
  data: {
    typographyScaleRatio?: string;
    shadowIntensity?: string;
    shadowColorStyle?: string;
    shadowBlurStyle?: string;
    reasoning?: string;
  };
}

const SCALE_LABELS: Record<string, string> = {
  majorSecond: "Major Second (1.125)",
  minorThird: "Minor Third (1.200)",
  majorThird: "Major Third (1.250)",
  perfectFourth: "Perfect Fourth (1.333)",
  goldenRatio: "Golden Ratio (1.618)",
};

export const FoundationsPreview: React.FC<FoundationsPreviewProps> = ({
  data,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-6">
      {/* Typography */}
      <div className="space-y-3">
        <div className="text-dark-400 text-xs uppercase tracking-wide">
          Typography
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Scale Ratio</span>
          <span className="font-mono text-dark-100 text-sm">
            {SCALE_LABELS[data.typographyScaleRatio ?? ""] ??
              data.typographyScaleRatio}
          </span>
        </div>
      </div>

      {/* Shadow */}
      <div className="space-y-3">
        <div className="text-dark-400 text-xs uppercase tracking-wide">
          Shadows
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Intensity</span>
          <span className="font-mono text-dark-100 text-sm capitalize">
            {data.shadowIntensity}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Color</span>
          <span className="font-mono text-dark-100 text-sm capitalize">
            {data.shadowColorStyle}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Blur</span>
          <span className="font-mono text-dark-100 text-sm capitalize">
            {data.shadowBlurStyle}
          </span>
        </div>
      </div>
    </div>
    {data.reasoning && (
      <p className="text-dark-400 text-sm italic mt-4">{data.reasoning}</p>
    )}
  </div>
);
