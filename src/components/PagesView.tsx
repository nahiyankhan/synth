/**
 * PagesView - Display example application screens using design system tokens
 *
 * Shows how design tokens look in realistic UI contexts
 */

import React from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleMode } from "@/types/styleGraph";

interface PagesViewProps {
  graph: StyleGraph;
  viewMode: StyleMode;
}

export const PagesView: React.FC<PagesViewProps> = ({ graph, viewMode }) => {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center text-dark-400">
        <p className="text-lg font-medium">No example pages configured</p>
        <p className="text-sm mt-2">Add page components to preview your design system in context</p>
      </div>
    </div>
  );
};
