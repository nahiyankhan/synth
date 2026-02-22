/**
 * LandingPage - Select or create a design language
 * Dark theme inspired by eBay Playbook
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllDesignLanguages,
  DesignLanguageMetadata,
  deleteDesignLanguage,
} from "../services/designLanguageDB";

interface LandingPageProps {
  onSelectLanguage: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectLanguage,
}) => {
  const navigate = useNavigate();
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
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

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

  // Fade in title on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Staggered card animation
  useEffect(() => {
    const totalCards = savedLanguages.length + 1; // +1 for "Create New" card
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < totalCards; i++) {
      const timer = setTimeout(() => {
        setVisibleCards((prev) => new Set(prev).add(i));
      }, i * 80);
      timers.push(timer);
    }

    return () => timers.forEach((t) => clearTimeout(t));
  }, [savedLanguages]);

  const handleSelectWithTransition = (id: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      onSelectLanguage(id);
    }, 300);
  };

  const handleGenerateNew = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate("/editor/create");
    }, 300);
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    language: DesignLanguageMetadata
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

  if (error) {
    return (
      <div className="h-screen w-full overflow-y-auto bg-dark-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-dark-400 hover:text-dark-50 transition-colors"
          >
            retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full overflow-y-auto bg-dark-900 transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Hero Section */}
      <div className="px-12 pt-12 pb-12">
        <h1
          className={`text-7xl font-bold tracking-tight text-dark-50 lowercase mb-4 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className=" text-dark-400">dla-01.</span> design Language Agent
        </h1>
      </div>

      {/* Cards Section */}
      <div className="px-12 pb-12">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[280px]">
            {/* Generate New Card - Accent colored */}
            <div
              onClick={handleGenerateNew}
              className={`flex flex-col gap-3 text-left group cursor-pointer transition-all duration-500 ease-out ${
                visibleCards.has(0)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {/* Card */}
              <div className="relative bg-accent-green rounded-2xl w-full h-[240px] hover:brightness-110 transition-all duration-200 overflow-hidden flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>

              {/* Title below card */}
              <div className="text-xl font-medium tracking-wide text-white lowercase px-1">
                Create New
              </div>
            </div>

            {/* Saved Languages */}
            {savedLanguages.map((lang, index) => (
              <div
                key={lang.id}
                onClick={() => handleSelectWithTransition(lang.id)}
                className={`flex flex-col gap-3 text-left group cursor-pointer transition-all duration-500 ease-out ${
                  visibleCards.has(index + 1)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                {/* Card */}
                <div
                  className="relative rounded-2xl w-full h-[240px] hover:brightness-110 transition-all duration-200 overflow-hidden flex items-center justify-end p-6"
                  style={{
                    backgroundColor: lang.primaryColor || "#2d2d2d",
                  }}
                >

                  {/* Delete button - positioned in bottom-left */}
                  <div className="absolute bottom-6 left-6">
                    <button
                      onClick={(e) => handleDeleteClick(e, lang)}
                      className="w-10 h-10 rounded-full bg-black/10 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4 text-black/50 group-hover:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Arrow - positioned in bottom-right */}
                  <div className="absolute bottom-6 right-6">
                    <div className="w-10 h-10 rounded-full bg-black/10 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <svg
                        className="w-4 h-4 text-black/50 group-hover:text-black/70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Title below card */}
                <div className="text-xl font-medium tracking-wide text-white lowercase px-1">
                  {lang.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.language && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-medium text-dark-50 mb-4">
              Delete design language?
            </h3>
            <p className="text-sm text-dark-400 mb-6">
              Are you sure you want to delete "
              <span className="font-medium text-dark-50">
                {deleteConfirmation.language.name}
              </span>
              "? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-5 py-2.5 text-sm text-dark-300 hover:text-dark-50 transition-colors rounded-lg hover:bg-dark-700"
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
