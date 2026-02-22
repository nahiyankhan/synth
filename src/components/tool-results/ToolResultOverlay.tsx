import React from "react";
import { ToolResult } from "../../types/toolUI";
import { TokenSearchResults } from "./TokenSearchResults";
import { TokenModificationResult } from "./TokenModificationResult";
import { ImpactAnalysisView } from "./ImpactAnalysisView";
import { SystemAnalysisView } from "./SystemAnalysisView";
import { NavigationResult } from "./NavigationResult";
import { ColorProposalView } from "./ColorProposalView";
import { TypographyAnalysisView } from "./TypographyAnalysisView";
import { SpacingAnalysisView } from "./SpacingAnalysisView";
import { XIcon } from "../icons";

interface ToolResultOverlayProps {
  result: ToolResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ToolResultOverlay: React.FC<ToolResultOverlayProps> = ({
  result,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !result) return null;

  const renderContent = () => {
    switch (result.type) {
      case "token-search":
        if (!result.searchResult) return null;
        return (
          <TokenSearchResults result={result.searchResult} onClose={onClose} />
        );

      case "token-modification":
        if (!result.modificationResult) return null;
        return (
          <TokenModificationResult
            result={result.modificationResult}
            onClose={onClose}
          />
        );

      case "impact-analysis":
        if (!result.impactAnalysis) return null;
        return (
          <ImpactAnalysisView
            result={result.impactAnalysis}
            onClose={onClose}
          />
        );

      case "system-analysis":
        if (!result.systemAnalysis) return null;
        return (
          <SystemAnalysisView
            result={result.systemAnalysis}
            onClose={onClose}
          />
        );

      case "navigation":
        if (!result.navigationResult) return null;
        return (
          <NavigationResult
            result={result.navigationResult}
            onClose={onClose}
          />
        );

      case "color-proposal":
        if (!result.colorProposal) return null;
        return (
          <ColorProposalView
            data={result.colorProposal}
            toolName={result.toolName}
            onClose={onClose}
          />
        );

      case "typography-analysis":
        if (!result.data) return null;
        return (
          <TypographyAnalysisView
            data={result.data}
            toolName={result.toolName}
            onClose={onClose}
          />
        );

      case "spacing-analysis":
        if (!result.data) return null;
        return (
          <SpacingAnalysisView
            data={result.data}
            toolName={result.toolName}
            onClose={onClose}
          />
        );

      case "color-visualization":
        // Color visualizations are handled separately via ColorSciencePanel
        // Just close the overlay
        onClose();
        return null;

      case "history-operation":
        if (!result.historyOperation) return null;
        return (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-dark-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-light text-dark-900">
                    {result.historyOperation.operation}
                  </h2>
                  <p className="text-sm text-dark-500 mt-1 font-light">
                    {result.historyOperation.description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-dark-400 hover:text-dark-900 transition-colors"
                >
                  <XIcon className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className="max-w-2xl mx-auto">
                <div
                  className={`rounded-lg p-6 ${
                    result.historyOperation.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {result.historyOperation.success ? (
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <h3
                      className={`text-base font-light ${
                        result.historyOperation.success
                          ? "text-green-900"
                          : "text-red-900"
                      }`}
                    >
                      {result.historyOperation.success ? "success" : "failed"}
                    </h3>
                  </div>
                  {result.historyOperation.affectedTokens.length > 0 && (
                    <div className="text-sm text-dark-700">
                      <div className="font-light mb-2">affected tokens:</div>
                      <div className="space-y-1">
                        {result.historyOperation.affectedTokens.map(
                          (token, idx) => (
                            <div
                              key={idx}
                              className="font-mono text-xs bg-white px-2 py-1 rounded"
                            >
                              {token}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "export-result":
        if (!result.exportResult) return null;
        return (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-dark-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-light text-dark-900">
                    export result
                  </h2>
                  <p className="text-sm text-dark-500 mt-1 font-light">
                    {result.exportResult.format.toUpperCase()} ·{" "}
                    {result.exportResult.tokenCount} tokens
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-dark-400 hover:text-dark-900 transition-colors"
                >
                  <XIcon className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-dark-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-dark-100 font-mono leading-relaxed">
                    {result.exportResult.content}
                  </pre>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        result.exportResult!.content
                      );
                    }}
                    className="px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-800 transition-colors text-sm font-light flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    copy to clipboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Overlay Panel */}
      <div className="fixed inset-y-0 right-0 w-[700px] bg-white shadow-2xl z-50 transform transition-transform">
        {renderContent()}
      </div>
    </>
  );
};
