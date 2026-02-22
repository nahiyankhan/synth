/**
 * StreamElement - Individual streaming elements that appear during generation
 *
 * Different element types for visualizing streamed data:
 * - ColorSwatch: Colored squares for palettes
 * - TextSample: Typography samples
 * - TokenChip: Design token names
 * - IconBlock: Icons/checkmarks
 */

import React from "react";
import { cn } from "@/lib/utils";

interface BaseStreamElementProps {
  /** Position within the container (0-1 normalized) */
  x: number;
  y: number;
  /** Whether the element is visible/animated in */
  visible?: boolean;
  className?: string;
  /** Animation delay in ms */
  delay?: number;
}

const baseStyles = cn(
  "absolute rounded-lg",
  "opacity-0 scale-50",
  "transition-all duration-400 ease-out",
  "-translate-x-1/2 -translate-y-1/2"
);

const visibleStyles = "opacity-100 scale-100";

// ============ Color Swatch ============
export interface ColorSwatchProps extends BaseStreamElementProps {
  color: string;
  size?: number;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  x,
  y,
  color,
  visible = false,
  size = 60,
  className,
  delay = 0,
}) => (
  <div
    className={cn(
      baseStyles,
      "shadow-lg rounded-xl",
      visible && visibleStyles,
      className
    )}
    style={{
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      width: size,
      height: size,
      backgroundColor: color,
      transitionDelay: `${delay}ms`,
    }}
  />
);

// ============ Text Sample ============
export interface TextSampleProps extends BaseStreamElementProps {
  text: string;
  fontSize?: number;
  fontWeight?: number;
}

export const TextSample: React.FC<TextSampleProps> = ({
  x,
  y,
  text,
  visible = false,
  fontSize = 14,
  fontWeight = 600,
  className,
  delay = 0,
}) => (
  <div
    className={cn(
      baseStyles,
      "px-4 py-2 bg-white shadow-md whitespace-nowrap",
      "text-cream-800",
      visible && visibleStyles,
      className
    )}
    style={{
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      fontSize,
      fontWeight,
      transitionDelay: `${delay}ms`,
    }}
  >
    {text}
  </div>
);

// ============ Token Chip ============
export interface TokenChipProps extends BaseStreamElementProps {
  text: string;
}

export const TokenChip: React.FC<TokenChipProps> = ({
  x,
  y,
  text,
  visible = false,
  className,
  delay = 0,
}) => (
  <div
    className={cn(
      baseStyles,
      "px-3 py-1.5 bg-white/90 rounded-full",
      "font-mono text-xs text-cream-600",
      "border border-cream-200",
      visible && visibleStyles,
      className
    )}
    style={{
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      transitionDelay: `${delay}ms`,
    }}
  >
    {text}
  </div>
);

// ============ Icon Block ============
export interface IconBlockProps extends BaseStreamElementProps {
  icon: string;
  iconColor?: string;
}

export const IconBlock: React.FC<IconBlockProps> = ({
  x,
  y,
  icon,
  iconColor,
  visible = false,
  className,
  delay = 0,
}) => (
  <div
    className={cn(
      baseStyles,
      "w-12 h-12 bg-white rounded-xl shadow-md",
      "flex items-center justify-center text-xl",
      visible && visibleStyles,
      className
    )}
    style={{
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      color: iconColor,
      transitionDelay: `${delay}ms`,
    }}
  >
    {icon}
  </div>
);

// ============ Generic Stream Element ============
export type StreamElementType = "color-swatch" | "text-sample" | "token-chip" | "icon-block";

export interface StreamElementConfig {
  type: StreamElementType;
  // Position will be computed
  x?: number;
  y?: number;
  // Type-specific props
  color?: string;
  text?: string;
  icon?: string;
  iconColor?: string;
  fontSize?: number;
  fontWeight?: number;
  size?: number;
}

export interface StreamElementProps {
  config: StreamElementConfig;
  index: number;
  total: number;
  visible?: boolean;
  containerSize?: number;
}

/**
 * Generate position for an element using golden angle distribution
 */
function generateElementPosition(
  index: number,
  _total: number,
  containerSize: number
): { x: number; y: number } {
  const center = containerSize / 2;
  const minRadius = containerSize * 0.2; // Stay outside AISignal
  const maxRadius = containerSize * 0.43;

  // Golden angle for nice distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;

  // Add some randomness to radius (seeded by index for consistency)
  const seed = Math.sin(index * 9999) * 10000;
  const randomFactor = 0.3 + 0.7 * (seed - Math.floor(seed));
  const radius = minRadius + (maxRadius - minRadius) * randomFactor;

  const x = (center + Math.cos(angle) * radius) / containerSize;
  const y = (center + Math.sin(angle) * radius) / containerSize;

  return { x, y };
}

export const StreamElement: React.FC<StreamElementProps> = ({
  config,
  index,
  total,
  visible = false,
  containerSize = 600,
}) => {
  const pos = config.x !== undefined && config.y !== undefined
    ? { x: config.x, y: config.y }
    : generateElementPosition(index, total, containerSize);

  const delay = index * 80; // Stagger animation

  switch (config.type) {
    case "color-swatch":
      return (
        <ColorSwatch
          x={pos.x}
          y={pos.y}
          color={config.color || "#888"}
          size={config.size}
          visible={visible}
          delay={delay}
        />
      );
    case "text-sample":
      return (
        <TextSample
          x={pos.x}
          y={pos.y}
          text={config.text || ""}
          fontSize={config.fontSize}
          fontWeight={config.fontWeight}
          visible={visible}
          delay={delay}
        />
      );
    case "token-chip":
      return (
        <TokenChip
          x={pos.x}
          y={pos.y}
          text={config.text || ""}
          visible={visible}
          delay={delay}
        />
      );
    case "icon-block":
      return (
        <IconBlock
          x={pos.x}
          y={pos.y}
          icon={config.icon || "●"}
          iconColor={config.iconColor}
          visible={visible}
          delay={delay}
        />
      );
    default:
      return null;
  }
};
