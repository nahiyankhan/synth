import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedProgress } from "./SegmentedProgress";
import { ScoreDisplay } from "./ScoreDisplay";
import { FeedbackChips, type FeedbackItem } from "./FeedbackChips";

interface VibeCheckCardProps {
  imageSrc: string;
  imageAlt?: string;
  score: number;
  feedback: FeedbackItem[];
  category?: string;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

function VibeCheckCard({
  imageSrc,
  imageAlt = "Design asset",
  score,
  feedback,
  category = "Typography",
  onPrev,
  onNext,
  className,
}: VibeCheckCardProps) {
  return (
    <div
      data-slot="vibe-check-card"
      className={cn(
        "flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-4xl mx-auto",
        className
      )}
    >
      {/* Main image section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Category title */}
        <h2 className="font-display text-3xl md:text-4xl text-center text-dark-900">
          {category}
        </h2>

        {/* Image with navigation */}
        <div className="relative flex items-center gap-4">
          {/* Previous button */}
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border transition-colors",
              onPrev
                ? "border-dark-300 text-dark-600 hover:bg-dark-100"
                : "border-dark-200 text-dark-300 cursor-not-allowed"
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Image container */}
          <div className="flex-1 relative">
            <div className="bg-white rounded-2xl shadow-[var(--dl-shadow-card)] overflow-hidden">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Progress bar below image */}
            <div className="mt-4">
              <SegmentedProgress value={score} />
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={onNext}
            disabled={!onNext}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border transition-colors",
              onNext
                ? "border-dark-300 text-dark-600 hover:bg-dark-100"
                : "border-dark-200 text-dark-300 cursor-not-allowed"
            )}
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar with score and feedback */}
      <div className="lg:w-64 flex flex-col gap-6 lg:pt-16">
        {/* AI indicator */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#00d632] flex items-center justify-center">
            <span className="text-white text-xs font-medium">AI</span>
          </div>
          <span className="text-xs text-dark-500">
            Tell us about the typography of the previous asset.
          </span>
        </div>

        {/* Score */}
        <ScoreDisplay score={score} />

        {/* Feedback chips */}
        <FeedbackChips items={feedback} />
      </div>
    </div>
  );
}

export { VibeCheckCard };
export type { VibeCheckCardProps };
