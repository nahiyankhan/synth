/**
 * ContentView - Voice & Tone Guidelines Display with Text Audit
 *
 * Side-by-side layout: Guidelines on left, Text audit on right
 */

import React, { useState, useMemo, useCallback, memo } from "react";
import { ContentSearchResult } from "../types/content";
import {
  getMarkdown,
  extractTableOfContents,
} from "../services/contentService";
import { auditText, searchGuidelines } from "../services/textAuditService";
import { MarkdownViewer } from "./content/MarkdownViewer";
import { TableOfContents } from "./content/TableOfContents";

import { StyleMode } from "../types/styleGraph";

interface ContentViewProps {
  viewMode: StyleMode;
}

// Memoized results panel - prevents re-rendering while typing
const AuditResultsPanel = memo<{
  auditError: string | null;
  auditSummary: string;
  auditResults: ContentSearchResult[];
  userText: string;
  isAuditing: boolean;
  highlightedChunkId: string | null;
  onScrollToChunk: (chunkId: string, headingId?: string) => void;
  getTypeColor: (type?: string) => string;
  getScoreColor: (score: number) => string;
}>(
  ({
    auditError,
    auditSummary,
    auditResults,
    userText,
    isAuditing,
    highlightedChunkId,
    onScrollToChunk,
    getTypeColor,
    getScoreColor,
  }) => {
    return (
      <>
        {auditError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{auditError}</p>
          </div>
        )}

        {auditSummary && (
          <div className="mb-6 p-4 bg-dark-100 rounded-xl">
            <p className="text-sm font-medium text-dark-900">{auditSummary}</p>
          </div>
        )}

        {auditResults.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-dark-900 uppercase tracking-wide">
              Relevant Guidelines ({auditResults.length})
            </h3>
            {auditResults.map((result) => {
              const isHighlighted = highlightedChunkId === result.id;
              return (
                <button
                  key={result.id}
                  onClick={() =>
                    onScrollToChunk(
                      result.id,
                      result.metadata.markdownRange?.headingId
                    )
                  }
                  className={`w-full p-4 border rounded-xl text-left transition-all hover:shadow-lg ${
                    isHighlighted
                      ? "border-dark-400 bg-dark-100"
                      : "border-dark-200 bg-white"
                  }`}
                >
                  {/* Score */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold ${getScoreColor(
                        result.score
                      )}`}
                    >
                      {Math.round(result.score * 100)}% Match
                    </span>
                    {result.metadata.type && (
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-md font-medium ${getTypeColor(
                          result.metadata.type
                        )}`}
                      >
                        {result.metadata.type}
                      </span>
                    )}
                  </div>

                  {/* Section */}
                  {result.metadata.section && (
                    <div className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">
                      {result.metadata.section}
                    </div>
                  )}

                  {/* Content text */}
                  <p className="text-sm text-dark-700 leading-relaxed">
                    {result.text.length > 200
                      ? result.text.substring(0, 200) + "..."
                      : result.text}
                  </p>

                  {/* Click hint */}
                  <div className="mt-3 text-xs text-dark-500 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    Click to view in guidelines
                  </div>
                </button>
              );
            })}
          </div>
        ) : !userText.trim() ? (
          <div className="flex items-center justify-center h-full">
            {/* Empty state when no text */}
          </div>
        ) : userText.trim() &&
          !isAuditing &&
          !auditError &&
          auditResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-500">
              Click "Audit Text" to check your writing
            </p>
          </div>
        ) : null}
      </>
    );
  }
);

AuditResultsPanel.displayName = "AuditResultsPanel";

export const ContentView: React.FC<ContentViewProps> = ({ viewMode }) => {
  const [userText, setUserText] = useState("");
  const [auditResults, setAuditResults] = useState<ContentSearchResult[]>([]);
  const [auditSummary, setAuditSummary] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(
    null
  );
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ContentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced word count calculation - only updates display after user stops typing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!userText.trim()) {
        setWordCount(0);
      } else {
        setWordCount(userText.trim().split(/\s+/).length);
      }
    }, 150); // Wait 150ms after user stops typing
    return () => clearTimeout(timer);
  }, [userText]);

  // Debounced search - triggers after user stops typing
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await searchGuidelines(searchQuery, 10);
        setSearchResults(response.results);
        if (response.error) {
          setSearchError(response.error);
        }
      } catch (error) {
        setSearchError(
          error instanceof Error ? error.message : "Search failed"
        );
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get content data
  const markdown = useMemo(() => {
    const md = getMarkdown();
    console.log("ContentView: markdown loaded:", !!md, md?.length);
    return md;
  }, []);
  const toc = useMemo(() => {
    const items = extractTableOfContents();
    console.log("ContentView: TOC items:", items.length);
    return items;
  }, []);

  // Memoize text change handler to prevent re-renders
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setUserText(e.target.value);
    },
    []
  );

  // Handle text audit
  const handleAuditText = useCallback(async () => {
    if (!userText.trim()) {
      setAuditSummary("Enter some text to audit.");
      setAuditResults([]);
      return;
    }

    setIsAuditing(true);
    setAuditError(null);

    try {
      const result = await auditText(userText, 10);
      setAuditResults(result.matches);
      setAuditSummary(result.summary);
      if (result.error) {
        setAuditError(result.error);
      }
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : "Audit failed");
      setAuditResults([]);
      setAuditSummary("");
    } finally {
      setIsAuditing(false);
    }
  }, [userText]);

  const getTypeColor = useCallback((type?: string) => {
    switch (type) {
      case "rule":
        return "bg-blue-100 text-blue-700";
      case "example":
        return "bg-green-100 text-green-700";
      case "dont":
        return "bg-red-100 text-red-700";
      default:
        return "bg-dark-100 text-dark-600";
    }
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score > 0.7) return "text-green-600";
    if (score > 0.5) return "text-yellow-600";
    return "text-red-600";
  }, []);

  const scrollToChunk = useCallback((chunkId: string, headingId?: string) => {
    setHighlightedChunkId(chunkId);
    if (headingId) {
      const element = document.getElementById(headingId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Flash highlight effect
        element.classList.add("bg-yellow-200", "");
        setTimeout(() => {
          element.classList.remove("bg-yellow-200", "");
        }, 2000);
      }
    }
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
        {/* Search Input */}
        <div className="shrink-0 p-4 border-b border-dark-200">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guidelines..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-dark-300 rounded-lg bg-white text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-dark-400"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="animate-spin h-4 w-4 text-dark-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Search Results or Table of Contents */}
        <div className="flex-1 overflow-auto hide-scrollbar p-4">
          {searchError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">{searchError}</p>
            </div>
          )}

          {searchQuery.trim() ? (
            // Search Results
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wide">
                  Search Results
                </h3>
                {searchResults.length > 0 && (
                  <span className="text-xs text-dark-400">
                    {searchResults.length} found
                  </span>
                )}
              </div>
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() =>
                      scrollToChunk(
                        result.id,
                        result.metadata.markdownRange?.headingId
                      )
                    }
                    className="w-full p-3 text-left border border-dark-200 rounded-lg bg-white hover:bg-dark-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium ${getScoreColor(
                          result.score
                        )}`}
                      >
                        {Math.round(result.score * 100)}%
                      </span>
                      {result.metadata.type && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${getTypeColor(
                            result.metadata.type
                          )}`}
                        >
                          {result.metadata.type}
                        </span>
                      )}
                    </div>
                    {result.metadata.section && (
                      <div className="text-xs font-medium text-dark-600 mb-1">
                        {result.metadata.section}
                      </div>
                    )}
                    <p className="text-xs text-dark-500 line-clamp-2">
                      {result.text.length > 100
                        ? result.text.substring(0, 100) + "..."
                        : result.text}
                    </p>
                  </button>
                ))
              ) : !isSearching ? (
                <p className="text-sm text-dark-500 text-center py-8">
                  No results found
                </p>
              ) : null}
            </div>
          ) : (
            // Table of Contents
            <div>
              <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">
                Guidelines
              </h3>
              <TableOfContents
                items={toc}
                scrollContainerRef={scrollContainerRef}
              />
            </div>
          )}
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

      {/* Right Side: Text Audit */}
      <div className="w-[500px] shrink-0 flex flex-col bg-dark-50/50 border-l border-dark-200">
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-dark-200">
          <h2 className="text-xl font-light text-dark-900 mb-2">Text Audit</h2>
          <p className="text-sm text-dark-600">
            Write your text below and audit it against the guidelines
          </p>
        </div>

        {/* Text Input */}
        <div className="shrink-0 p-6 border-b border-dark-200">
          <textarea
            value={userText}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              // Cmd/Ctrl + Enter to audit
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleAuditText();
              }
            }}
            placeholder="Write your text here..."
            className="w-full h-40 px-4 py-3 border border-dark-300 rounded-xl bg-white text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-dark-400 resize-none font-sans"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {wordCount > 0 && (
                <p className="text-xs text-dark-500">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </p>
              )}
              <p className="text-xs text-dark-500">
                <kbd className="px-1.5 py-0.5 bg-dark-200 rounded text-xs font-mono">
                  ⌘ Enter
                </kbd>{" "}
                to audit
              </p>
            </div>
            <button
              onClick={handleAuditText}
              disabled={isAuditing || !userText.trim()}
              className="px-6 py-2.5 bg-dark-900 text-white rounded-xl font-medium transition-all hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isAuditing ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Auditing...
                </span>
              ) : (
                "Audit Text"
              )}
            </button>
          </div>
        </div>

        {/* Audit Results */}
        <div className="flex-1 overflow-auto hide-scrollbar p-6">
          <AuditResultsPanel
            auditError={auditError}
            auditSummary={auditSummary}
            auditResults={auditResults}
            userText={userText}
            isAuditing={isAuditing}
            highlightedChunkId={highlightedChunkId}
            onScrollToChunk={scrollToChunk}
            getTypeColor={getTypeColor}
            getScoreColor={getScoreColor}
          />
        </div>
      </div>
    </div>
  );
};
