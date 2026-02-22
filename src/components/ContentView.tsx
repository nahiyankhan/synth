/**
 * ContentView - Voice & Tone Guidelines Display
 *
 * Displays markdown guidelines with table of contents navigation
 */

import React, { useMemo } from "react";
import {
  getMarkdown,
  extractTableOfContents,
} from "../services/contentService";
import { MarkdownViewer } from "./content/MarkdownViewer";
import { TableOfContents } from "./content/TableOfContents";

import { StyleMode } from "../types/styleGraph";

interface ContentViewProps {
  viewMode: StyleMode;
}

export const ContentView: React.FC<ContentViewProps> = ({ viewMode }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Get content data
  const markdown = useMemo(() => {
    const md = getMarkdown();
    return md;
  }, []);
  const toc = useMemo(() => {
    const items = extractTableOfContents();
    return items;
  }, []);

  if (!markdown) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-dark-500 text-lg">
            No content guidelines available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-white rounded-xl border border-dark-200">
      <style>{`
        /* Hide scrollbar for webkit browsers (Chrome, Safari, Edge) */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for Firefox */
        .hide-scrollbar {
          scrollbar-width: none;
        }

        /* Hide scrollbar for IE and Edge Legacy */
        .hide-scrollbar {
          -ms-overflow-style: none;
        }
      `}</style>

      {/* Table of Contents Sidebar */}
      <div className="w-72 shrink-0 border-r border-dark-200 flex flex-col bg-dark-50/50">
        <div className="flex-1 overflow-auto hide-scrollbar p-4">
          <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">
            Guidelines
          </h3>
          <TableOfContents
            items={toc}
            scrollContainerRef={scrollContainerRef}
          />
        </div>
      </div>

      {/* Markdown Document */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto hide-scrollbar"
      >
        <div className="max-w-4xl mx-auto p-8 lg:p-12">
          <MarkdownViewer markdown={markdown} />
        </div>
      </div>
    </div>
  );
};
