import React from "react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export type ColorViewModeType = "canvas" | "list" | "flow";

interface ColorViewModeToolbarProps {
  viewMode: ColorViewModeType;
  onViewModeChange: (mode: ColorViewModeType) => void;
}

export const ColorViewModeToolbar: React.FC<ColorViewModeToolbarProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(value) => {
        if (value) onViewModeChange(value as ColorViewModeType);
      }}
      variant="inverse"
      size="sm"
      className="rounded-lg w-fit"
    >
        <ToggleGroupItem value="canvas" aria-label="Canvas view">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="text-xs">canvas</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List view">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-xs">list</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="flow" aria-label="Flow view">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="6" height="4" rx="1" />
            <rect x="2" y="14" width="6" height="4" rx="1" />
            <rect x="16" y="10" width="6" height="4" rx="1" />
            <path d="M8 8h4a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-4" />
            <path d="M8 16h4a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-4" />
          </svg>
          <span className="text-xs">flow</span>
        </ToggleGroupItem>
    </ToggleGroup>
  );
};
