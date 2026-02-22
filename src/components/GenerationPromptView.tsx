/**
 * GenerationPromptView - Immersive design language generation interface
 *
 * Replaces the modal with an in-canvas experience where the user can:
 * - See the question/prompt
 * - Respond via voice, text, or image (future)
 * - Watch real-time previews as phases complete with collapsible cards
 */

import React, { useState, useRef } from "react";
import { ImageAttachmentInput } from "./ImageAttachmentInput";
import { GenerationFlowChart } from "./GenerationFlowChart";
import { useImageAttachments } from "../hooks/useImageAttachments";
import type { GenerationStatus } from "../hooks/useDesignGeneration";
import type { ImageAttachment } from "../types/multimodal";
import { XIcon } from "./icons";

interface GenerationPromptViewProps {
  status: GenerationStatus;
  onSubmitPrompt: (prompt: string, images?: ImageAttachment[]) => void;
  isVoiceActive: boolean;
}

export const GenerationPromptView: React.FC<GenerationPromptViewProps> = ({
  status,
  onSubmitPrompt,
  isVoiceActive,
}) => {
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Image attachments
  const {
    attachments,
    addFileImage,
    addUrlImage,
    removeAttachment,
    clearAttachments,
    canAddMore,
  } = useImageAttachments();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !status.isGenerating) {
      onSubmitPrompt(
        textInput.trim(),
        attachments.length > 0 ? attachments : undefined
      );
      setTextInput("");
      clearAttachments();
    }
  };

  const isGenerating = status.isGenerating;
  const hasStarted = isGenerating || status.hasGenerated;

  return (
    <div className="flex-1 flex flex-col items-start justify-start pt-16 px-12 pb-32 overflow-y-auto">
      {/* Main Prompt */}
      {!hasStarted && (
        <div className="w-full space-y-8 animate-fade-in">
          <div className="space-y-4"></div>

          {/* Input Methods */}
          <div className="space-y-6">
            {/* Text Input Toggle */}
            {!showTextInput ? (
              // <div className="text-center">
              //   <button
              //     onClick={() => setShowTextInput(true)}
              //     className="text-sm text-dark-500 hover:text-dark-900 transition-colors flex items-center gap-2 mx-auto"
              //   >
              //     <svg
              //       className="w-4 h-4"
              //       fill="none"
              //       viewBox="0 0 24 24"
              //       stroke="currentColor"
              //     >
              //       <path
              //         strokeLinecap="round"
              //         strokeLinejoin="round"
              //         strokeWidth={2}
              //         d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              //       />
              //     </svg>
              //     Prefer to type? Click here
              //   </button>
              // </div>
              <></>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g., 'A modern fintech app that needs to feel trustworthy and professional' or 'Healthcare product with calm, accessible design'"
                  className="w-full px-6 py-4 text-lg bg-dark-800 border border-dark-700 focus:border-dark-500 text-dark-50 placeholder:text-dark-500 resize-none transition-all"
                  rows={4}
                  disabled={isGenerating}
                />

                {/* Image attachments */}
                <ImageAttachmentInput
                  attachments={attachments}
                  onAddFile={addFileImage}
                  onAddUrl={addUrlImage}
                  onRemove={removeAttachment}
                  canAddMore={canAddMore}
                  disabled={isGenerating}
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowTextInput(false)}
                    className="text-xs text-dark-400 hover:text-dark-600 transition-colors flex items-center gap-1"
                  >
                    <XIcon className="w-3 h-3" />
                    Hide
                  </button>

                  <button
                    type="submit"
                    disabled={!textInput.trim() || isGenerating}
                    className="px-6 py-3 bg-dark-700 hover:bg-dark-600 disabled:bg-dark-800 disabled:text-dark-600 text-dark-50 font-mono text-sm tracking-tight transition-colors disabled:cursor-not-allowed"
                  >
                    generate system
                  </button>
                </div>
              </form>
            )}

            {/* Vibe Cards - Always visible, visual aesthetic directions */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    title: "minimalist fintech",
                    description: "clean, trustworthy, professional",
                    prompt:
                      "Create a minimal and precise design language for a fintech app that needs to feel trustworthy and professional",
                  },
                  {
                    title: "bold e-commerce",
                    description: "high contrast, energetic, confident",
                    prompt:
                      "Generate a bold and vibrant design system for an e-commerce platform with high contrast and confident visual presence",
                  },
                  {
                    title: "healthcare calm",
                    description: "warm, natural, comfortable",
                    prompt:
                      "Make a warm and organic design language for a healthcare product with natural colors and comfortable spacing",
                  },
                  {
                    title: "technical dashboard",
                    description: "dark, precise, sophisticated",
                    prompt:
                      "Create a dark and technical design system for a developer dashboard with precise details and sophisticated hierarchy",
                  },
                  {
                    title: "social media vibrant",
                    description: "colorful, playful, youthful",
                    prompt:
                      "Generate a colorful and playful design language for a social media app targeting younger audiences",
                  },
                  {
                    title: "enterprise saas",
                    description: "professional, scalable, clear",
                    prompt:
                      "Create a professional and scalable design system for an enterprise SaaS platform with clear hierarchy",
                  },
                  {
                    title: "creative portfolio",
                    description: "expressive, artistic, unique",
                    prompt:
                      "Make an expressive and artistic design language for a creative portfolio site with unique visual style",
                  },
                  {
                    title: "educational clean",
                    description: "clear, accessible, readable",
                    prompt:
                      "Generate a clear and accessible design system for an educational platform focused on readability and learning",
                  },
                ].map((example) => (
                  <button
                    key={example.title}
                    onClick={() => {
                      // Always trigger generation directly when clicking a suggestion
                      onSubmitPrompt(example.prompt);
                    }}
                    disabled={isGenerating}
                    className="group rounded-2xl text-left p-12 bg-dark-800 hover:bg-dark-700 text-dark-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="space-y-1">
                      <h3 className="text-4xl font-bold tracking-tight">
                        {example.title}
                      </h3>
                      <p className="text-sm text-dark-300 group-hover:text-dark-200 transition-colors">
                        {example.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation In Progress / Complete */}
      {hasStarted && (
        <div className="w-full space-y-6 mb-8">
          {/* Status Header */}
          <div className="space-y-2">
            {isGenerating ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h2 className="text-2xl font-light text-dark-50">
                    generating..
                  </h2>
                </div>
                {status.statusMessage && (
                  <p className="text-dark-300 text-sm">{status.statusMessage}</p>
                )}
              </>
            ) : (
              <h2 className="text-2xl font-light text-green-500">
                design language generated
              </h2>
            )}
          </div>

          {/* Flow Chart */}
          <GenerationFlowChart status={status} />
        </div>
      )}
    </div>
  );
};
