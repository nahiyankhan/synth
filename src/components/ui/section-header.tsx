/**
 * SectionHeader - Consistent section/label headers
 *
 * A reusable component for uppercase section labels used throughout
 * the application, particularly in preview cards and detail panels.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export interface SectionHeaderProps {
  /** The header content */
  children: React.ReactNode;
  /** HTML element to render as */
  as?: "h2" | "h3" | "h4" | "div" | "p" | "span";
  /** Bottom margin size */
  spacing?: "none" | "sm" | "md" | "lg";
  /** Text color variant */
  variant?: "default" | "muted" | "light";
  /** Whether to include letter spacing */
  tracking?: boolean;
  /** Additional className */
  className?: string;
}

const spacingClasses = {
  none: "",
  sm: "mb-1",
  md: "mb-2",
  lg: "mb-3",
};

const variantClasses = {
  default: "text-dark-400",
  muted: "text-dark-500",
  light: "text-dark-600",
};

/**
 * A consistent header component for section labels.
 *
 * @example
 * ```tsx
 * <SectionHeader>Core Message</SectionHeader>
 * <SectionHeader as="h3" spacing="lg" variant="muted">Details</SectionHeader>
 * ```
 */
export function SectionHeader({
  children,
  as: Component = "h4",
  spacing = "md",
  variant = "default",
  tracking = false,
  className,
}: SectionHeaderProps) {
  return (
    <Component
      className={cn(
        "text-xs font-semibold uppercase",
        spacingClasses[spacing],
        variantClasses[variant],
        tracking && "tracking-wide",
        className
      )}
    >
      {children}
    </Component>
  );
}
