import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { PaletteGroup } from "./useColorGrouping";
import { ColorListItem, ColorSwatch } from "./ColorListItem";

interface ColorPaletteGroupProps {
  group: PaletteGroup;
  isExpanded: boolean;
  onToggle: () => void;
  selectedColors: Set<string>;
  onSelectColor: (nodeId: string, e: React.MouseEvent) => void;
  hoveredColorId: string | null;
  onHoverColor: (nodeId: string | null) => void;
}

export const ColorPaletteGroup: React.FC<ColorPaletteGroupProps> = ({
  group,
  isExpanded,
  onToggle,
  selectedColors,
  onSelectColor,
  hoveredColorId,
  onHoverColor,
}) => {
  const totalCount = group.primitives.length + group.semanticMappings.length;

  // Create a mini color strip preview for collapsed state
  const colorStripColors = group.primitives.slice(0, 11).map((c) => c.resolvedColor);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 px-4 py-3 bg-dark-50 hover:bg-dark-100 rounded-lg transition-colors cursor-pointer">
          {/* Expand/collapse chevron */}
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
            className={`shrink-0 text-dark-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>

          {/* Group name */}
          <span className="font-semibold text-dark-900">{group.displayName}</span>

          {/* Count badge */}
          <span className="text-xs text-dark-400 bg-dark-100 px-2 py-0.5 rounded-full">
            {totalCount}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Color strip preview */}
          <div className="flex gap-0.5">
            {colorStripColors.map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-4 pl-6">
          {/* Primitive swatches */}
          {group.primitives.length > 0 && (
            <div>
              <div className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">
                Scale
              </div>
              <div className="flex flex-wrap gap-2">
                {group.primitives.map((color) => (
                  <ColorSwatch
                    key={color.node.id}
                    color={color.resolvedColor}
                    oklch={color.oklch}
                    step={color.step}
                    isSelected={selectedColors.has(color.node.id)}
                    isHovered={hoveredColorId === color.node.id}
                    onClick={(e) => onSelectColor(color.node.id, e)}
                    onMouseEnter={() => onHoverColor(color.node.id)}
                    onMouseLeave={() => onHoverColor(null)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Semantic mappings */}
          {group.semanticMappings.length > 0 && (
            <div>
              <div className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">
                Semantic Tokens
              </div>
              <div className="space-y-1">
                {group.semanticMappings.map((semantic) => (
                  <ColorListItem
                    key={semantic.node.id}
                    name={semantic.node.name}
                    color={semantic.resolvedColor}
                    oklch={semantic.oklch}
                    isSelected={selectedColors.has(semantic.node.id)}
                    isHovered={hoveredColorId === semantic.node.id}
                    onClick={(e) => onSelectColor(semantic.node.id, e)}
                    onMouseEnter={() => onHoverColor(semantic.node.id)}
                    onMouseLeave={() => onHoverColor(null)}
                    reference={semantic.referencedPrimitive?.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
