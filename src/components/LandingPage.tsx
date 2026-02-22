/**
 * LandingPage - Select or create a design language
 * Circular layout with languages orbiting the center
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, ArrowRight } from "lucide-react";
import { AISignal } from "@/components/AISignal";
import {
  getAllDesignLanguages,
  DesignLanguageMetadata,
  deleteDesignLanguage,
} from "@/services/designLanguageDB";

interface LandingPageProps {
  onSelectLanguage: (id: string) => void;
}

const SAMPLE_PROMPTS = [
  "A minimal design system for a meditation app",
  "Bold and playful brand for a children's education platform",
  "Enterprise SaaS with a professional, trustworthy feel",
  "Luxury fashion brand with elegant typography",
  "Cyberpunk aesthetic for a gaming platform",
  "Warm and organic feel for a sustainable food brand",
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectLanguage,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [savedLanguages, setSavedLanguages] = useState<
    DesignLanguageMetadata[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    language: DesignLanguageMetadata | null;
  }>({ isOpen: false, language: null });
  const [isVisible, setIsVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const languages = await getAllDesignLanguages();
        setSavedLanguages(languages);
      } catch (err: any) {
        console.error("Failed to load design languages:", err);
        setError(err.message || "Failed to load design languages");
      }
    };

    loadLanguages();
  }, []);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus input when entering create mode
  useEffect(() => {
    if (isCreateMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreateMode]);

  const handleSelectWithTransition = (id: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      onSelectLanguage(id);
    }, 300);
  };

  const handleToggleCreateMode = () => {
    setIsCreateMode(!isCreateMode);
    if (isCreateMode) {
      setPrompt("");
    }
  };

  const handleSubmitPrompt = (selectedPrompt?: string) => {
    const finalPrompt = selectedPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsTransitioning(true);
    setTimeout(() => {
      navigate("/editor/create", { state: { prompt: finalPrompt } });
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && prompt.trim()) {
      handleSubmitPrompt();
    }
    if (e.key === "Escape") {
      setIsCreateMode(false);
      setPrompt("");
    }
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    language: DesignLanguageMetadata,
  ) => {
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, language });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, language: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.language) return;

    try {
      await deleteDesignLanguage(deleteConfirmation.language.id);
      const languages = await getAllDesignLanguages();
      setSavedLanguages(languages);
      setDeleteConfirmation({ isOpen: false, language: null });
    } catch (err: any) {
      console.error("Failed to delete design language:", err);
      setError(err.message || "Failed to delete design language");
    }
  };

  // Calculate position for each item in the orbit
  const getOrbitPosition = (
    index: number,
    total: number,
    radius: number = 180,
  ) => {
    const angleOffset = -90; // Start from top
    const angle = angleOffset + (360 / total) * index;
    const radians = (angle * Math.PI) / 180;

    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  if (error) {
    return (
      <div className="h-screen w-full overflow-y-auto bg-cream-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-cream-600 hover:text-cream-800 transition-colors"
          >
            retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-full bg-cream-100 overflow-hidden transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Centered orbital layout */}
      <div className="relative h-full w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Center: AISignal + Create/Close button or Chat input */}
          <div className="relative flex items-center justify-center">
            <div
              className="text-cream-400"
              style={{ viewTransitionName: "ai-signal" }}
            >
              <AISignal
                state={isCreateMode ? "thinking" : "idle"}
                size={120}
                showOrbitCircles={false}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Plus button - fades out */}
              <button
                onClick={handleToggleCreateMode}
                className={`absolute w-14 h-14 rounded-full bg-cream-800 hover:bg-cream-700 flex items-center justify-center transition-all duration-300 ${
                  isCreateMode ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
                }`}
                style={{ viewTransitionName: "center-action" }}
                title="Create new design language"
              >
                <Plus className="w-6 h-6 text-cream-100" />
              </button>

              {/* Chat input bar - blur fades in */}
              <div
                className={`absolute flex items-center gap-2 bg-white rounded-full shadow-lg border border-cream-200 pl-5 pr-2 py-2 transition-all duration-300 ${
                  isCreateMode
                    ? "opacity-100 blur-0 scale-100"
                    : "opacity-0 blur-sm scale-95 pointer-events-none"
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your design language..."
                  className="w-80 bg-transparent outline-none text-cream-900 placeholder:text-cream-400 text-sm"
                />
                <button
                  onClick={() => handleSubmitPrompt()}
                  disabled={!prompt.trim()}
                  className="w-9 h-9 rounded-full bg-cream-800 hover:bg-cream-700 disabled:bg-cream-300 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <ArrowRight className="w-4 h-4 text-cream-100" />
                </button>
                <button
                  onClick={handleToggleCreateMode}
                  className="w-9 h-9 rounded-full bg-cream-200 hover:bg-cream-300 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Cancel"
                >
                  <X className="w-4 h-4 text-cream-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Orbiting language circles - hidden in create mode */}
          {savedLanguages.map((lang, index) => {
            const pos = getOrbitPosition(index, savedLanguages.length);
            return (
              <div
                key={lang.id}
                className={`absolute top-1/2 left-1/2 transition-all duration-500 ease-out ${
                  isVisible && !isCreateMode
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-50"
                }`}
                style={{
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  transitionDelay: isCreateMode ? "0ms" : `${index * 80}ms`,
                }}
              >
                <div
                  onClick={() => handleSelectWithTransition(lang.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleDeleteClick(e, lang);
                  }}
                  className="group relative w-20 h-20 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: lang.primaryColor || "#2d2d2d",
                  }}
                  title={lang.name}
                >
                  {/* Language initial */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-semibold text-black/50">
                      {lang.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Hover label */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm text-cream-700">{lang.name}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sample prompt pills - shown in create mode */}
          {SAMPLE_PROMPTS.map((samplePrompt, index) => {
            const pos = getOrbitPosition(index, SAMPLE_PROMPTS.length, 280);
            return (
              <div
                key={index}
                className={`absolute top-1/2 left-1/2 transition-all duration-500 ease-out ${
                  isCreateMode ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
                style={{
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  transitionDelay: isCreateMode ? `${index * 60}ms` : "0ms",
                }}
              >
                <button
                  onClick={() => handleSubmitPrompt(samplePrompt)}
                  className="px-5 py-2.5 rounded-full bg-cream-200 hover:bg-cream-300 text-cream-800 text-sm w-[400px] text-center transition-colors whitespace-normal leading-tight"
                >
                  {samplePrompt}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.language && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-cream-50 border border-cream-300 rounded-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200 shadow-xl">
            <h3 className="text-2xl font-medium text-cream-900 mb-4">
              Delete design language?
            </h3>
            <p className="text-sm text-cream-600 mb-6">
              Are you sure you want to delete "
              <span className="font-medium text-cream-900">
                {deleteConfirmation.language.name}
              </span>
              "? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-5 py-2.5 text-sm text-cream-600 hover:text-cream-900 transition-colors rounded-lg hover:bg-cream-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
