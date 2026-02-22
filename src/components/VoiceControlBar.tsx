import React, { useState, useEffect } from "react";
import { AppState } from "../types/app";

interface VoiceControlBarProps {
  appState: AppState;
  onStartSession: () => void;
  onStopSession: () => void;
  dark?: boolean;
}

// Dot Matrix Visualizer Component
const DotMatrixVisualizer: React.FC<{ appState: AppState; dark?: boolean }> = ({
  appState,
  dark = false,
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const rows = 4;
  const cols = 64; // Added 4 columns (2 on each side)

  useEffect(() => {
    if (appState === AppState.IDLE) return;

    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [appState]);

  const getDotOpacity = (rowIndex: number, colIndex: number): number => {
    const middleRow = Math.floor(rows / 2);

    // Calculate edge fade for rounded corner effect
    let edgeFade = 1;

    // Fade out the first and last 2 columns to simulate rounded corners
    if (colIndex < 2) {
      // Left edge - more fade for outermost, less for inner
      edgeFade = colIndex === 0 ? 0.3 : 0.6;
    } else if (colIndex >= cols - 2) {
      // Right edge - more fade for outermost, less for inner
      edgeFade = colIndex === cols - 1 ? 0.3 : 0.6;
    }

    // Also fade based on row position to create rounded effect
    if (
      (colIndex < 2 || colIndex >= cols - 2) &&
      (rowIndex === 0 || rowIndex === rows - 1)
    ) {
      edgeFade *= 0.5; // Extra fade at corners
    }

    let baseOpacity: number;

    switch (appState) {
      case AppState.LISTENING:
        // Straight line with slight noise - mostly on middle rows
        if (rowIndex === middleRow || rowIndex === middleRow - 1) {
          baseOpacity = 0.6 + Math.random() * 0.2; // Some variation
        } else {
          baseOpacity = Math.random() * 0.15; // Very faint on other rows
        }
        break;

      case AppState.SPEAKING:
        // Waves and pitches - audio waveform simulation
        const waveFreq = 0.3;
        const timeOffset = animationFrame * 0.2;
        const wave = Math.sin((colIndex + timeOffset) * waveFreq);
        const amplitude =
          Math.sin(colIndex * 0.1 + animationFrame * 0.15) * 0.5 + 0.5;

        // Map wave to row height
        const waveHeight = (wave * amplitude * (rows - 1)) / 2 + (rows - 1) / 2;
        const distanceFromWave = Math.abs(rowIndex - waveHeight);

        // Brighter near the wave center
        if (distanceFromWave < 1) {
          baseOpacity = 0.8 - distanceFromWave * 0.3;
        } else {
          baseOpacity = Math.random() * 0.1;
        }
        break;

      case AppState.PROCESSING:
        // Pulsing effect - LLM thinking/responding
        const pulseFactor = Math.sin(animationFrame * 0.15);
        const basePulse = pulseFactor * 0.3 + 0.5;

        // Add some variation across columns
        const columnVariation =
          Math.sin(colIndex * 0.2 + animationFrame * 0.1) * 0.2;

        baseOpacity = basePulse + columnVariation;
        break;

      case AppState.LOADING:
        // Loading wave pattern
        const pulse = Math.sin(animationFrame * 0.1 + colIndex * 0.05);
        baseOpacity = pulse * 0.3 + 0.4;
        break;

      case AppState.ERROR:
        // Red-tinted blinking
        baseOpacity = animationFrame % 20 < 10 ? 0.6 : 0.3;
        break;

      case AppState.IDLE:
      default:
        // Static decorative pattern
        baseOpacity = 0.15;
        break;
    }

    // Apply edge fade to create rounded corner effect
    return baseOpacity * edgeFade;
  };

  const getDotColor = (): string => {
    if (appState === AppState.ERROR) return "bg-red-500";
    if (appState === AppState.PROCESSING) return "bg-blue-500";
    if (appState === AppState.SPEAKING) return "bg-green-600";
    return dark ? "bg-dark-700" : "bg-white";
  };

  return (
    <div className="flex flex-col gap-0.5 justify-center overflow-hidden px-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`w-1 h-1 rounded-full ${getDotColor()} transition-opacity duration-100`}
              style={{
                opacity: getDotOpacity(rowIndex, colIndex),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const VoiceControlBar: React.FC<VoiceControlBarProps> = ({
  appState,
  onStartSession,
  onStopSession,
  dark = false,
}) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleVoiceClick = () => {
    if (isVoiceActive) {
      // Toggle off if already active
      setIsVoiceActive(false);
      if (appState !== AppState.IDLE && appState !== AppState.ERROR) {
        onStopSession();
      }
    } else {
      // Switch to voice mode
      setIsVoiceActive(true);
      if (appState === AppState.IDLE || appState === AppState.ERROR) {
        onStartSession();
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div
        className={`rounded-full overflow-hidden shadow-lg ${
          dark ? "bg-white" : "bg-dark-900"
        }`}
      >
        <div className="flex items-stretch">
          {/* Dot Matrix Visualizer - Left Side */}
          <div className="flex-1 flex items-center">
            <DotMatrixVisualizer appState={appState} dark={dark} />
          </div>

          {/* Control Buttons - Right Side */}
          <div
            className={`grid grid-cols-2 border-l ${
              dark ? "border-dark-200/50" : "border-white/20"
            }`}
          >
            {/* Listen Button */}
            <button
              onClick={handleVoiceClick}
              className={`py-3 px-4 flex items-center justify-center transition-all ${
                dark
                  ? `hover:bg-dark-100 ${isVoiceActive ? "bg-dark-100" : ""}`
                  : `hover:bg-white/10 ${isVoiceActive ? "bg-white/20" : ""}`
              }`}
              title="Listen"
            >
              <div className="relative">
                {isVoiceActive &&
                  appState !== AppState.IDLE &&
                  appState !== AppState.ERROR && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                <svg
                  className={`w-4 h-4 ${dark ? "text-dark-700" : "text-white"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
              </div>
            </button>

            {/* Stop Button */}
            <button
              onClick={onStopSession}
              disabled={
                appState === AppState.IDLE || appState === AppState.ERROR
              }
              className={`py-3 px-4 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                dark ? "hover:bg-dark-100" : "hover:bg-white/10"
              }`}
              title="Stop"
            >
              <div
                className={`w-4 h-4 rounded-sm ${
                  dark ? "bg-dark-700" : "bg-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
