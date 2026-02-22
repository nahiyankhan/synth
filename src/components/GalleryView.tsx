/**
 * GalleryView - Overview of all design language aspects
 * Bold colored cards inspired by eBay Playbook
 */

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleMode } from "@/types/styleGraph";

interface GalleryViewProps {
  graph: StyleGraph;
  viewMode: StyleMode;
  hasBrandContext?: boolean;
  hasPages?: boolean;
  hasContent?: boolean;
}

interface AspectCard {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  gridSize?: "small" | "medium" | "large" | "wide" | "tall";
  bgColor: string;
  textColor: "white" | "black";
}

const getAspectCards = (
  hasBrandContext?: boolean,
  hasPages?: boolean,
  hasContent?: boolean
): AspectCard[] => [
  {
    id: "visual-direction",
    title: "Visual Direction",
    description: "Brand identity and design strategy",
    gridSize: "wide",
    bgColor: "bg-violet-400",
    textColor: "black",
    isActive: hasBrandContext ?? false,
  },
  {
    id: "colors",
    title: "Colors",
    description: "Color palette and system",
    gridSize: "wide",
    bgColor: "bg-blue-400",
    textColor: "black",
    isActive: true,
  },
  {
    id: "typography",
    title: "Typography",
    description: "Type scale and font system",
    gridSize: "medium",
    bgColor: "bg-slate-400",
    textColor: "black",
    isActive: true,
  },
  {
    id: "sizes",
    title: "Spacing",
    description: "Spacing scale and rhythm",
    gridSize: "medium",
    bgColor: "bg-amber-400",
    textColor: "black",
    isActive: true,
  },
  {
    id: "components",
    title: "Components",
    description: "UI component library",
    gridSize: "medium",
    bgColor: "bg-emerald-400",
    textColor: "black",
    isActive: true,
  },
  {
    id: "content",
    title: "Content",
    description: "Writing guidelines and voice",
    gridSize: "medium",
    bgColor: "bg-rose-400",
    textColor: "black",
    isActive: hasContent ?? false,
  },
  {
    id: "pages",
    title: "Pages",
    description: "Example page templates",
    gridSize: "medium",
    bgColor: "bg-cyan-400",
    textColor: "black",
    isActive: hasPages ?? false,
  },
  {
    id: "motion",
    title: "Motion",
    description: "Animation and transitions",
    gridSize: "small",
    bgColor: "bg-orange-400",
    textColor: "black",
    isActive: false,
  },
  {
    id: "playground",
    title: "Generative Playground",
    description: "Create UI with AI, preview in your design language",
    gridSize: "wide",
    bgColor: "bg-fuchsia-400",
    textColor: "black",
    isActive: true,
  },
];

export const GalleryView: React.FC<GalleryViewProps> = ({
  graph,
  viewMode,
  hasBrandContext,
  hasPages,
  hasContent,
}) => {
  const navigate = useNavigate();
  const [visibleCards, setVisibleCards] = React.useState<Set<string>>(
    new Set()
  );

  const handleCardClick = (cardId: string) => {
    if (cardId === "playground") {
      navigate("/playground");
    } else {
      navigate(`/editor/${cardId}`);
    }
  };

  const aspectCards = useMemo(
    () => getAspectCards(hasBrandContext, hasPages, hasContent),
    [hasBrandContext, hasPages, hasContent]
  );

  // Sequential pop-in animation on mount
  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    aspectCards.forEach((card, index) => {
      const timer = setTimeout(() => {
        setVisibleCards((prev) => new Set(prev).add(card.id));
      }, index * 80);
      timers.push(timer);
    });

    return () => timers.forEach((t) => clearTimeout(t));
  }, [aspectCards]);

  const renderCardContent = (cardId: string, textColor: "white" | "black") => {
    const colorClass = textColor === "white" ? "text-white" : "text-black";
    const borderClass = textColor === "white" ? "border-white" : "border-black";

    switch (cardId) {
      case "visual-direction":
        return (
          <div className="flex items-center justify-center h-full">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              className={colorClass}
            >
              <polygon
                points="60,20 85,50 95,80 60,90 25,80 35,50"
                fill="currentColor"
                opacity="0.15"
              />
              <circle
                cx="60"
                cy="60"
                r="15"
                fill="currentColor"
                opacity="0.1"
              />
            </svg>
          </div>
        );

      case "colors":
        return (
          <div className="flex items-center justify-center h-full gap-3">
            <div className="flex flex-col gap-3">
              <div
                className={`w-16 h-16 rounded-full ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-[0.18]`}
              />
              <div
                className={`w-16 h-16 rounded-full ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-[0.12]`}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div
                className={`w-16 h-16 rounded-full ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-[0.08]`}
              />
              <div
                className={`w-16 h-16 rounded-full ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-[0.05]`}
              />
            </div>
          </div>
        );

      case "typography":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="relative inline-block">
              <div
                className={`text-8xl font-bold ${colorClass} opacity-[0.18] leading-none`}
                style={{
                  borderTop: `2px solid currentColor`,
                  borderBottom: `2px solid currentColor`,
                  paddingTop: "4px",
                  paddingBottom: "4px",
                }}
              >
                Aa
              </div>
            </div>
          </div>
        );

      case "sizes":
        return (
          <div className="flex items-center justify-center h-full gap-4">
            <div
              className={`w-12 h-20 rounded ${borderClass} border-2 opacity-15`}
            />
            <div className={`flex flex-col justify-center gap-1`}>
              <div
                className={`w-8 h-[2px] ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-15`}
              />
              <div
                className={`w-8 h-[2px] ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-15`}
              />
              <div
                className={`w-8 h-[2px] ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-15`}
              />
            </div>
            <div
              className={`w-12 h-20 rounded ${borderClass} border-2 opacity-15`}
            />
          </div>
        );

      case "components":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`w-16 h-16 rounded-lg ${borderClass} border-2 opacity-15`}
              />
              <div
                className={`w-16 h-16 rounded-full ${borderClass} border-2 opacity-15`}
              />
              <div
                className={`w-16 h-16 rounded ${borderClass} border-2 opacity-15`}
              />
              <div
                className={`w-16 h-16 rounded-xl ${borderClass} border-2 opacity-15`}
              />
            </div>
          </div>
        );

      case "content":
        return (
          <div className="flex items-center justify-center h-full px-8">
            <div className="flex flex-col gap-3 w-full">
              <div
                className={`h-3 ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } rounded opacity-[0.18]`}
              />
              <div
                className={`h-3 ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } rounded opacity-[0.12] w-5/6`}
              />
              <div
                className={`h-3 ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } rounded opacity-[0.18] w-11/12`}
              />
              <div
                className={`h-3 ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } rounded opacity-[0.08] w-3/4`}
              />
            </div>
          </div>
        );

      case "pages":
        return (
          <div className="flex items-center justify-center h-full">
            <div
              className={`w-32 h-40 rounded-lg ${borderClass} border-2 opacity-15 flex flex-col p-2 gap-2`}
            >
              <div
                className={`h-6 ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } rounded opacity-[0.25]`}
              />
              <div
                className={`flex-1 ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } rounded opacity-[0.18]`}
              />
              <div
                className={`h-4 ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } rounded opacity-[0.25]`}
              />
            </div>
          </div>
        );

      case "motion":
        return (
          <div className="flex items-center justify-center h-full">
            <svg
              width="120"
              height="80"
              viewBox="0 0 120 80"
              className={colorClass}
            >
              <path
                d="M 10 40 Q 40 10, 60 40 T 110 40"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.15"
              />
              <circle
                cx="110"
                cy="40"
                r="6"
                fill="currentColor"
                opacity="0.15"
              />
              <polygon
                points="110,40 100,35 100,45"
                fill="currentColor"
                opacity="0.15"
              />
            </svg>
          </div>
        );

      case "playground":
        return (
          <div className="flex items-center justify-center h-full gap-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              className={colorClass}
            >
              <line
                x1="15"
                y1="65"
                x2="55"
                y2="25"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.18"
              />
              <circle cx="60" cy="20" r="3" fill="currentColor" opacity="0.2" />
              <circle cx="70" cy="30" r="2" fill="currentColor" opacity="0.15" />
              <circle cx="65" cy="12" r="2" fill="currentColor" opacity="0.15" />
              <circle cx="52" cy="15" r="2" fill="currentColor" opacity="0.12" />
              <circle cx="72" cy="18" r="1.5" fill="currentColor" opacity="0.1" />
            </svg>
            <div className="flex flex-col gap-2">
              <div
                className={`w-24 h-6 rounded ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-[0.15]`}
              />
              <div
                className={`w-20 h-4 rounded ${
                  textColor === "white" ? "bg-white" : "bg-black"
                } opacity-[0.1]`}
              />
              <div className="flex gap-2 mt-1">
                <div
                  className={`w-10 h-6 rounded ${
                    textColor === "white" ? "bg-white" : "bg-black"
                  } opacity-[0.18]`}
                />
                <div
                  className={`w-10 h-6 rounded ${
                    textColor === "white" ? "bg-white" : "bg-black"
                  } opacity-[0.12]`}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderCard = (card: AspectCard) => {
    const isClickable = card.isActive;
    const isVisible = visibleCards.has(card.id);

    const gridSizeClasses = {
      small: "col-span-1 row-span-1",
      medium: "col-span-1 row-span-1",
      large: "col-span-2 row-span-2",
      wide: "col-span-2 row-span-1",
      tall: "col-span-1 row-span-2",
    };

    const sizeClass = gridSizeClasses[card.gridSize || "medium"];

    return (
      <button
        key={card.id}
        onClick={() => isClickable && handleCardClick(card.id)}
        disabled={!isClickable}
        className={`
          flex flex-col gap-3 text-left group
          transition-all duration-500 ease-out
          ${sizeClass}
          ${
            isVisible
              ? isClickable
                ? "opacity-100 translate-y-0"
                : "opacity-40 translate-y-0"
              : "opacity-0 translate-y-4"
          }
          ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}
        `}
      >
        <div
          className={`
            relative ${card.bgColor} rounded-2xl
            w-full h-[240px]
            hover:brightness-110
            transition-all duration-200 overflow-hidden
          `}
        >
          {renderCardContent(card.id, card.textColor)}
        </div>

        <div className="text-xl font-medium tracking-wide text-white lowercase px-1">
          {card.title}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full transition-all duration-300 px-12 py-8">
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[280px]">
          {aspectCards
            .filter((card) => card.isActive)
            .map((card) => renderCard(card))}
        </div>
      </div>
    </div>
  );
};
