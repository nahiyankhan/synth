/**
 * TailwindColorsPreview - Preview for Tailwind colors phase
 *
 * Shows primary/secondary hues, chromas, and gray settings.
 */

import React from "react";

interface TailwindColorsPreviewProps {
  data: {
    primaryHue?: number;
    primaryChroma?: number;
    secondaryHue?: number;
    secondaryChroma?: number;
    hasSecondary?: boolean;
    grayWarmth?: string;
    graySaturation?: string;
    reasoning?: string;
    brand?: {
      primary?: { hue?: number; chroma?: number };
      secondary?: { hue?: number; chroma?: number };
    };
    gray?: {
      warmth?: string;
      saturation?: string;
    };
  };
}

export const TailwindColorsPreview: React.FC<TailwindColorsPreviewProps> = ({
  data,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Primary Hue</span>
          <span className="font-mono text-dark-100">
            {data.primaryHue ?? data.brand?.primary?.hue}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Primary Chroma</span>
          <span className="font-mono text-dark-100">
            {data.primaryChroma ?? data.brand?.primary?.chroma}
          </span>
        </div>
        {(data.hasSecondary || data.brand?.secondary) && (
          <>
            <div className="flex justify-between">
              <span className="text-dark-400 text-sm">Secondary Hue</span>
              <span className="font-mono text-dark-100">
                {data.secondaryHue ?? data.brand?.secondary?.hue}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400 text-sm">Secondary Chroma</span>
              <span className="font-mono text-dark-100">
                {data.secondaryChroma ?? data.brand?.secondary?.chroma}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Gray Warmth</span>
          <span className="font-mono text-dark-100">
            {data.grayWarmth ?? data.gray?.warmth}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400 text-sm">Gray Saturation</span>
          <span className="font-mono text-dark-100">
            {data.graySaturation ?? data.gray?.saturation}
          </span>
        </div>
      </div>
    </div>
    {data.reasoning && (
      <p className="text-dark-400 text-sm italic mt-4">{data.reasoning}</p>
    )}
  </div>
);
