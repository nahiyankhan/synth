import * as React from "react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  categories: string[];
  selected?: string;
  onSelect: (category: string) => void;
  className?: string;
}

function CategorySelector({
  categories,
  selected,
  onSelect,
  className,
}: CategorySelectorProps) {
  return (
    <div
      data-slot="category-selector"
      className={cn("flex flex-col items-center gap-2", className)}
    >
      <span className="text-xs text-dark-500 mb-2">
        Start a new session
      </span>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "font-display text-4xl md:text-5xl transition-colors",
            selected === category
              ? "text-dark-900"
              : "text-dark-400 hover:text-dark-600"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export { CategorySelector };
export type { CategorySelectorProps };
