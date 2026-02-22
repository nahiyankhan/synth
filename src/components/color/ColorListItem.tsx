import React from "react";
import { OKLCHColor } from "../../services/colorScience";

interface ColorListItemProps {
  name: string;
  color: string;
  oklch: OKLCHColor;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  reference?: string;
  step?: number;
}

// Chroma-based border radius (matching canvas view)
// Low chroma (grays) = circular, High chroma (saturated) = rectangular
function getSwatchBorderRadius(oklch: OKLCHColor, size: number): number {
  const baseRadius = size / 2;
  const chromaFactor = 1 - Math.min(oklch.c * 2.5, 1);
  return baseRadius * chromaFactor;
}

export const ColorListItem: React.FC<ColorListItemProps> = ({
  name,
  color,
  oklch,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  reference,
  step,
}) => {
  const swatchSize = 32;
  const borderRadius = getSwatchBorderRadius(oklch, swatchSize);

  // Format OKLCH values for display
  const formatOklch = () => {
    return `L: ${(oklch.l * 100).toFixed(0)}% C: ${oklch.c.toFixed(2)} H: ${Math.round(oklch.h)}°`;
  };

  // Get display name (last part of path)
  const displayName = name.split(".").pop() || name;

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
        ${isSelected ? "bg-dark-100 ring-2 ring-dark-400" : ""}
        ${isHovered && !isSelected ? "bg-dark-50" : ""}
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Color swatch */}
      <div
        className="shrink-0 shadow-sm border border-dark-200"
        style={{
          width: swatchSize,
          height: swatchSize,
          backgroundColor: color,
          borderRadius: borderRadius,
        }}
      />

      {/* Name and step */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-dark-900 truncate text-sm">
            {displayName}
          </span>
          {step !== undefined && (
            <span className="text-xs text-dark-400 font-mono">{step}</span>
          )}
        </div>
        {reference && (
          <div className="text-xs text-dark-400 truncate flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span className="truncate">{reference}</span>
          </div>
        )}
      </div>

      {/* Hex value */}
      <code className="text-xs font-mono text-dark-500 shrink-0">
        {color.toUpperCase()}
      </code>

      {/* OKLCH values (shown on hover) */}
      <div
        className={`text-[10px] font-mono text-dark-400 shrink-0 w-36 text-right transition-opacity ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        {formatOklch()}
      </div>
    </div>
  );
};

// Compact swatch for primitive scale display
interface ColorSwatchProps {
  color: string;
  oklch: OKLCHColor;
  step?: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  oklch,
  step,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const size = 48;
  const borderRadius = getSwatchBorderRadius(oklch, size);

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`
          shadow-sm border transition-all
          ${isSelected ? "ring-2 ring-dark-900 ring-offset-2" : "border-dark-200"}
          ${isHovered && !isSelected ? "scale-110 shadow-md" : ""}
        `}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: borderRadius,
        }}
      />
      {step !== undefined && (
        <span className="text-[10px] font-mono text-dark-500">{step}</span>
      )}
    </div>
  );
};
