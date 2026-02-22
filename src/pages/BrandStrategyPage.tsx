import React from "react";
import { VoiceControlBar } from "../components/VoiceControlBar";
import { ToolCallDisplay } from "../components/ToolCallDisplay";
import { DevPanel } from "../components/DevPanel";
import { ToolResultOverlay } from "../components/tool-results";
import { useViewPage } from "../hooks/useViewPage";

export const BrandStrategyPage: React.FC = () => {
  const {
    navigate,
    appState,
    currentEvent,
    previousEvent,
    currentLanguageMetadata,
    toolUIState,
    closeOverlay,
    isVisible,
    startSession,
    stopSession,
    handleExecutePrompt,
    handleToolCall,
    isLoading,
    isProcessingText,
  } = useViewPage({ currentView: "visual-direction" });

  const visualDirection = currentLanguageMetadata?.generationMetadata?.brandContext?.visualDirection;

  if (isLoading) {
    return (
      <div className="h-screen bg-white text-dark-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-8 h-8 border-2 border-dark-300 border-t-dark-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-dark-500 font-light tracking-wide">
            loading design system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-dark-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="w-full bg-white z-40 shrink-0">
        <div
          className={`px-12 pt-12 pb-4 transition-opacity duration-700 ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => navigate("/")}
            className="text-7xl font-bold tracking-tight mr-2 text-dark-400 hover:text-dark-900 transition-colors"
          >
            home
          </button>
          <span className="text-7xl font-bold tracking-tight text-dark-400 mr-2">
            .
          </span>
          <button
            onClick={() => navigate("/editor")}
            className="text-7xl font-bold tracking-tight mr-2 text-dark-400 hover:text-dark-900 transition-colors lowercase"
          >
            {currentLanguageMetadata?.name || "untitled"}
          </button>
          <span className="text-7xl font-bold tracking-tight text-dark-400 mr-2">
            .
          </span>
          <span className="text-7xl font-bold tracking-tight text-dark-900 lowercase">
            visual direction
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-12 py-8">
          <div className="space-y-12">
            {visualDirection ? (
              <>
                {/* Summary & Direction */}
                <div className="space-y-6">
                  <div className="bg-white border border-dark-200 rounded-2xl p-6 space-y-4">
                    {visualDirection.name && (
                      <h2 className="text-3xl font-semibold text-dark-900">
                        {visualDirection.name}
                      </h2>
                    )}

                    {visualDirection.coreMessage && (
                      <div className="bg-dark-100 rounded-xl p-4 italic text-lg">
                        "{visualDirection.coreMessage}"
                      </div>
                    )}

                    {visualDirection.summary && (
                      <p className="text-dark-700 text-lg">
                        {visualDirection.summary}
                      </p>
                    )}

                    {visualDirection.direction && (
                      <div className="pt-4 border-t border-dark-200">
                        <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wide mb-2">
                          Strategic Direction
                        </h3>
                        <p className="text-dark-900">
                          {visualDirection.direction}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Traits */}
                {visualDirection.traits && visualDirection.traits.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-light text-dark-900">
                      Brand Traits
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {visualDirection.traits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-dark-100 text-dark-900 rounded-full text-sm"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice & Tone */}
                {visualDirection.voiceTone && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-light text-dark-900">
                      Voice & Tone
                    </h2>
                    <div className="bg-white border border-dark-200 rounded-2xl p-6">
                      <p className="text-dark-900">
                        {visualDirection.voiceTone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Design Principles */}
                {visualDirection.designPrinciples && visualDirection.designPrinciples.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-light text-dark-900">
                      Design Principles
                    </h2>
                    <div className="bg-white border border-dark-200 rounded-2xl p-6">
                      <ul className="space-y-3">
                        {visualDirection.designPrinciples.map((principle, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-dark-400 mt-1">•</span>
                            <span className="text-dark-900">{principle}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Visual References & Aesthetics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {visualDirection.visualReferences && visualDirection.visualReferences.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-light text-dark-900">
                        Visual References
                      </h2>
                      <div className="bg-white border border-dark-200 rounded-2xl p-6">
                        <ul className="space-y-2">
                          {visualDirection.visualReferences.map((ref, idx) => (
                            <li key={idx} className="text-dark-700">{ref}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {visualDirection.aestheticPreferences && visualDirection.aestheticPreferences.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-light text-dark-900">
                        Aesthetic Preferences
                      </h2>
                      <div className="bg-white border border-dark-200 rounded-2xl p-6">
                        <div className="flex flex-wrap gap-2">
                          {visualDirection.aestheticPreferences.map((pref, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-dark-100 text-dark-900 rounded-full text-sm"
                            >
                              {pref}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emotional Resonance */}
                {visualDirection.emotionalResonance && visualDirection.emotionalResonance.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-light text-dark-900">
                      Emotional Goals
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {visualDirection.emotionalResonance.map((emotion, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-dark-100 text-dark-900 rounded-full text-sm"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-dark-200 rounded-2xl p-12 text-center">
                <p className="text-dark-500">
                  No visual direction found for this design language.
                </p>
                <p className="text-sm text-dark-400 mt-2">
                  Generate a new design language to see its visual direction.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Call Display */}
      <ToolCallDisplay
        currentEvent={currentEvent}
        previousEvent={previousEvent}
      />

      {/* Voice Control Bar */}
      <VoiceControlBar
        appState={appState}
        onStartSession={startSession}
        onStopSession={stopSession}
      />

      {/* Dev Panel */}
      <DevPanel
        onExecutePrompt={handleExecutePrompt}
        isProcessing={isProcessingText}
        currentView="visual-direction"
      />

      {/* Tool Result Overlay */}
      <ToolResultOverlay
        result={toolUIState.activeResult}
        isOpen={toolUIState.isOverlayOpen}
        onClose={closeOverlay}
      />
    </div>
  );
};
