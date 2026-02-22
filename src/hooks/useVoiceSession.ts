import { useRef, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, decodeAudioData } from "../services/audioUtils";
import { getEnhancedGeminiTools } from "../types/aiTools";
import {
  navigationTools,
  getLandingPageInstructions,
} from "../types/navigationAiTools";
import {
  generationTools,
  getGenerationModeInstructions,
} from "../types/generationAiTools";
import { useApp } from "../context/AppContext";
import { useDesignLanguage } from "../context/DesignLanguageContext";
import { getApiKey } from "../utils/apiKeyStorage";
import { useVoiceSettings } from "../context/VoiceSettingsContext";
import { useToolCall } from "../context/ToolCallContext";
import { AppState, VoiceRefs } from "../types/app";
import { getContextAwareSystemInstructions } from "../services/systemInstructions";
import { getToolsForView } from "../services/toolFilter";

export const useVoiceSession = (
  onToolCall: (toolCall: any, sessionPromiseRef: React.MutableRefObject<any> | null) => Promise<void>,
  options?: {
    currentView?: string | null;
  }
) => {
  const location = useLocation();
  const { appState, setAppState, addLog, updateLastLog } = useApp();
  const {
    setVoiceSearchResults,
    currentLanguageMetadata,
    selectedNodes,
    graph,
    viewMode,
  } = useDesignLanguage();
  const { voiceSettings } = useVoiceSettings();
  const { showEvent } = useToolCall();

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const shouldSendAudioRef = useRef<boolean>(true);
  const sessionStartTimeRef = useRef<number>(0);
  const durationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserSpeechRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const outputTranscriptAccumulatorRef = useRef<string>("");
  const isAccumulatingTranscriptRef = useRef<boolean>(false);
  const previousViewRef = useRef<string | null>(null);
  const lastHintTimeRef = useRef<number>(0);

  // Session duration limit: 14 minutes (with 1-minute buffer before 15-minute hard limit)
  const SESSION_DURATION_LIMIT = 14 * 60 * 1000;
  const SESSION_WARNING_TIME = 13 * 60 * 1000; // Warning at 13 minutes

  // Inactivity detection - offer help after 45 seconds of silence
  const INACTIVITY_TIMEOUT = 45 * 1000;

  // Context-change hint timing
  const CONTEXT_HINT_DELAY = 2000; // 2s after view change
  const MIN_TIME_BETWEEN_HINTS = 10000; // 10s minimum between any hints
  const MIN_SILENCE_FOR_HINT = 3000; // Only hint if user hasn't spoken in 3s

  // Get contextual hint based on current view
  const getContextualHint = useCallback((view: string | null): string => {
    switch (view) {
      case "colors":
        return "Colors view. I can analyze your palette, check contrast ratios, find similar colors, generate color scales, or help you search for specific tokens. What would you like to explore?";

      case "typography":
        return "Typography view. I can help you analyze your type scale, search for specific font sizes, suggest improvements, or explain how tokens are organized. What do you need?";

      case "sizes":
        return "Sizes view showing spacing and border radius. I can help you search values, analyze your spacing scale, find tokens designed for specific uses, or suggest harmonious spacing. How can I help?";

      case "components":
        return "Components view. I can explain component specs, show you what tokens they use, search for specific components, or help you understand design patterns. What would you like to know?";

      case "content":
        return "Content & voice guide. I can help you understand the tone guidelines, explain content strategy, or answer questions about writing style. What interests you?";

      case null: // Gallery
        return "Gallery overview. You can navigate to Colors, Typography, Sizes, Components, or Content. Just say where you want to go, or ask me to search for specific tokens.";

      default:
        return "";
    }
  }, []);

  const getSystemInstruction = useCallback(() => {
    const route = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    const currentView = options?.currentView;

    // Use shared system instructions with voice-specific additions
    const baseInstructions = getContextAwareSystemInstructions({
      languageName: currentLanguageMetadata?.name || "the design language",
      currentView,
      route,
      mode,
      selectedNodes,
      graph,
      viewMode,
    });

    // For editor mode, add voice-specific guidance
    if (route !== "/" && route !== "" && mode !== "generate") {
      return (
        baseInstructions +
        `

VOICE-SPECIFIC GUIDANCE:
- Hex colors: "hash one A five F seven A" → "#1A5F7A"
- Token paths: User may say "base dot color dot grey dot 65 dot light" → "base.color.grey.65.light"
- Ambiguous requests: Always clarify
  - "Make it darker" → "Which token? By what percentage or to what shade?"
  - "Update the primary color" → "To what value? A specific hex or reference another token?"
- Read back hex codes phonetically: "hash F F six B six B"
- For multi-step operations, narrate your plan: "I'll first check impact, then update the token"
- NEVER repeat yourself - say each distinct piece of information only once
- Keep responses brief and to the point - avoid redundancy
`
      );
    }

    // Add voice-specific guidance for landing page too
    if (route === "/" || route === "") {
      return (
        baseInstructions +
        `

VOICE-SPECIFIC GUIDANCE:
- Be brief and direct - say things once
- NEVER repeat yourself or say the same information twice
- Keep confirmations short: "Opening X" or "Creating Y" (don't elaborate unless asked)
`
      );
    }

    return baseInstructions;
  }, [
    currentLanguageMetadata,
    location.pathname,
    location.search,
    options?.currentView,
  ]);

  // Send proactive messages to trigger AI responses
  const sendProactiveMessage = useCallback(
    async (message: string) => {
      if (!sessionPromiseRef.current) {
        // Session not active - this is expected if called before session starts
        return;
      }

      try {
        const session = await sessionPromiseRef.current;
        if (!session) {
          return;
        }
        // Send text using sendClientContent (correct API method per docs)
        session.sendClientContent({ turns: message, turnComplete: true });
        addLog(`💭 Proactive hint sent`);
      } catch (error) {
        // Silently fail - session might have closed
        console.debug("Could not send proactive message:", error);
      }
    },
    [addLog]
  );

  const startSession = useCallback(async () => {
    addLog("▶️ startSession called");
    console.trace("startSession call stack");

    // Prevent multiple simultaneous session starts
    if (sessionPromiseRef.current) {
      addLog("⚠️ Session already starting or active");
      return;
    }

    try {
      addLog("🔄 Setting app state to LOADING");
      setAppState(AppState.LOADING);
      const apiKey = getApiKey('gemini');
      if (!apiKey) {
        throw new Error("API key not found");
      }

      const ai = new GoogleGenAI({ apiKey });

      shouldSendAudioRef.current = true;

      // Initialize Audio Contexts
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

      const inputCtx = inputAudioContextRef.current;
      const outputCtx = outputAudioContextRef.current;

      addLog("🎤 Requesting microphone access...");
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      addLog("✓ Microphone access granted");

      // Load AudioWorklet processor module
      try {
        addLog("📦 Loading audio processor...");
        await inputCtx.audioWorklet.addModule("/audio-processor.js");
        addLog("✓ Audio processor loaded");
      } catch (workletError) {
        console.error("Failed to load audio processor:", workletError);
        addLog(`❌ Failed to load audio processor: ${workletError}`);
        throw workletError;
      }

      // Create the source node
      const source = inputCtx.createMediaStreamSource(streamRef.current);
      sourceNodeRef.current = source;

      // Create AudioWorkletNode (modern replacement for ScriptProcessorNode)
      addLog("🔧 Creating audio worklet node...");
      const workletNode = new AudioWorkletNode(
        inputCtx,
        "audio-input-processor",
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1,
        }
      );
      audioWorkletNodeRef.current = workletNode;

      // Tell the worklet to NOT send audio yet (wait for connection)
      workletNode.port.postMessage({ type: "setShouldSend", value: false });
      addLog("✓ Audio worklet node created (paused)");

      // Handle audio data from the worklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type === "audioData" && shouldSendAudioRef.current) {
          const inputData = event.data.data;

          // Validate we received audio data
          if (!inputData || inputData.length === 0) {
            return;
          }

          // Only send if we have an active session
          if (!sessionPromiseRef.current) {
            return;
          }

          const pcmBlob = createPcmBlob(inputData);

          sessionPromiseRef.current
            .then((session) => {
              // Double-check session is still valid
              if (session && sessionPromiseRef.current) {
                // Send audio using the correct API format per docs
                session.sendRealtimeInput({
                  audio: {
                    data: pcmBlob.data,
                    mimeType: pcmBlob.mimeType,
                  },
                });
              }
            })
            .catch((err) => {
              // Session closed or error - stop trying to send
              console.debug("Session no longer available for audio:", err);
            });
        }
      };

      // Connect: source -> worklet -> destination (silent)
      source.connect(workletNode);

      const gainNode = inputCtx.createGain();
      gainNode.gain.value = 0; // Silent - we don't want to hear ourselves
      workletNode.connect(gainNode);
      gainNode.connect(inputCtx.destination);
      addLog("✓ Audio pipeline connected");

      // Track session start time for duration management
      sessionStartTimeRef.current = Date.now();

      // Set up duration monitoring
      durationCheckIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - sessionStartTimeRef.current;

        if (elapsed > SESSION_DURATION_LIMIT) {
          addLog(
            "⚠️ Session approaching 15-minute limit. Reconnecting required."
          );
          if (durationCheckIntervalRef.current) {
            clearInterval(durationCheckIntervalRef.current);
            durationCheckIntervalRef.current = null;
          }
          // The session will be stopped by the server automatically
          // User should manually restart the session
        } else if (elapsed > SESSION_WARNING_TIME) {
          addLog(
            "⏰ Session has been active for 13 minutes. Consider restarting soon."
          );
        }
      }, 60000); // Check every minute

      addLog("🌐 Connecting to Gemini Live API...");
      const connectPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        callbacks: {
          onopen: async () => {
            addLog("✓ Connected to Voice Agent");
            setAppState(AppState.LISTENING);

            // Wait a moment for the connection to be fully stable before enabling audio
            setTimeout(() => {
              if (audioWorkletNodeRef.current && sessionPromiseRef.current) {
                audioWorkletNodeRef.current.port.postMessage({
                  type: "setShouldSend",
                  value: true,
                });
                addLog("✓ Audio streaming enabled");
              }
            }, 500); // Wait 500ms for connection to stabilize

            // Send proactive greeting based on context
            // Wait a bit for the session to be fully ready
            let greetingRetries = 0;
            const MAX_GREETING_RETRIES = 10; // Max 5 seconds of waiting (10 * 500ms)

            const sendGreeting = async () => {
              try {
                // Check if session is still active
                if (!sessionPromiseRef.current) {
                  addLog("⚠️ Session closed before greeting could be sent");
                  return;
                }

                const session = await connectPromise;

                // Double-check session is still valid
                if (!session || !sessionPromiseRef.current) {
                  addLog("⚠️ Session no longer active");
                  return;
                }

                const route = location.pathname;
                const searchParams = new URLSearchParams(location.search);
                const mode = searchParams.get("mode");
                let greeting = "";

                if (route === "/" || route === "") {
                  // Landing page - fast and direct
                  greeting =
                    "Informal greeting. You handle design languages. What's the move?";
                } else if (mode === "generate") {
                  // Generation mode - matches UI prompt exactly
                  greeting = "What kind of vibe are you going for?";
                } else {
                  // Editor mode - wait for language metadata to load
                  // Check if we have the actual language name (not just the fallback)
                  if (!currentLanguageMetadata?.name) {
                    greetingRetries++;
                    if (greetingRetries < MAX_GREETING_RETRIES) {
                      // Graph not loaded yet - wait a bit and try again
                      console.log(
                        `⏳ Graph not loaded yet, waiting... (retry ${greetingRetries}/${MAX_GREETING_RETRIES})`
                      );
                      setTimeout(sendGreeting, 500); // Retry after 500ms
                      return;
                    } else {
                      // Give up after max retries - send generic greeting
                      console.warn(
                        "⚠️ Graph didn't load in time, sending generic greeting"
                      );
                      greeting =
                        "Design language editor ready. I can help you explore colors, typography, spacing, components, or content. What would you like to do?";
                    }
                  } else {
                    const languageName = currentLanguageMetadata.name;
                    greeting = `${languageName} loaded. I can help you explore colors, typography, spacing, components, or content. You can also ask me to search for specific tokens or make changes. What would you like to do?`;
                  }
                }

                // Send text as client content (correct API method per docs)
                session.sendClientContent({
                  turns: greeting,
                  turnComplete: true,
                });
                addLog(`💭 Proactive greeting sent`);
              } catch (error) {
                console.error("Error sending greeting:", error);
                addLog(`⚠️ Could not send greeting: ${error}`);
              }
            };

            // Initial delay to ensure session is ready
            setTimeout(sendGreeting, 1500);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output - process ALL parts, not just the first
            if (message.serverContent?.modelTurn?.parts) {
              const audioPartsCount = message.serverContent.modelTurn.parts.filter(
                p => p.inlineData?.data
              ).length;
              
              if (audioPartsCount > 0) {
                console.debug(`📢 Received ${audioPartsCount} audio part(s)`);
              }
              
              for (const part of message.serverContent.modelTurn.parts) {
                const audioData = part.inlineData?.data;
                if (audioData) {
                  setAppState(AppState.SPEAKING);
                  nextStartTimeRef.current = Math.max(
                    nextStartTimeRef.current,
                    outputCtx.currentTime
                  );
                  const audioBuffer = await decodeAudioData(
                    new Uint8Array(
                      Array.from(atob(audioData), (c) => c.charCodeAt(0))
                    ),
                    outputCtx,
                    24000
                  );
                  const sourceNode = outputCtx.createBufferSource();
                  sourceNode.buffer = audioBuffer;
                  sourceNode.connect(outputCtx.destination);
                  sourceNode.onended = () => {
                    sourcesRef.current.delete(sourceNode);
                    if (sourcesRef.current.size === 0)
                      setAppState(AppState.LISTENING);
                  };
                  sourceNode.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(sourceNode);
                }
              }
            }

            // Handle output transcription (what the agent said)
            if (message.serverContent?.outputTranscription) {
              const transcript = message.serverContent.outputTranscription.text;
              if (transcript) {
                // Accumulate transcript chunks for complete sentence
                outputTranscriptAccumulatorRef.current += transcript;

                // Update UI with streaming transcript
                if (!isAccumulatingTranscriptRef.current) {
                  // First chunk - create new log entry
                  addLog(`🤖 Agent: ${outputTranscriptAccumulatorRef.current}`);
                  isAccumulatingTranscriptRef.current = true;
                } else {
                  // Subsequent chunks - update the last log entry
                  updateLastLog(
                    `🤖 Agent: ${outputTranscriptAccumulatorRef.current}`
                  );
                }
              }
            }

            // Check if turn is complete - log full accumulated transcript
            if (
              message.serverContent?.turnComplete &&
              outputTranscriptAccumulatorRef.current
            ) {
              console.log(
                "🤖 AI transcript (complete):",
                outputTranscriptAccumulatorRef.current.trim()
              );
              // Reset accumulator and flag for next turn
              outputTranscriptAccumulatorRef.current = "";
              isAccumulatingTranscriptRef.current = false;
            }

            // Handle input transcription (what you said)
            if (message.serverContent?.inputTranscription) {
              const userTranscript =
                message.serverContent.inputTranscription.text;
              if (userTranscript) {
                addLog(`👤 You: ${userTranscript}`);

                // Track user activity for inactivity detection
                lastUserSpeechRef.current = Date.now();

                // Reset inactivity timer
                if (inactivityTimerRef.current) {
                  clearTimeout(inactivityTimerRef.current);
                }

                // Set new timer - offer help after period of silence
                inactivityTimerRef.current = setTimeout(() => {
                  const route = location.pathname;
                  const searchParams = new URLSearchParams(location.search);
                  const mode = searchParams.get("mode");
                  let hint = "";

                  if (route === "/" || route === "") {
                    hint = "You there? Design languages, questions - pick one.";
                  } else if (mode === "generate") {
                    hint =
                      "Still here. What vibe are you going for? I can generate once you describe it.";
                  } else {
                    // Editor mode - make inactivity hint view-aware
                    const currentView = options?.currentView;
                    if (currentView) {
                      // User is in a specific view
                      hint = `Still looking at ${currentView}? I can help with specific tasks here, or you can navigate to another view. What do you need?`;
                    } else {
                      // User is in gallery
                      hint =
                        "Waiting. I can search, modify, analyze - what do you need?";
                    }
                  }

                  // Check minimum time between hints
                  const timeSinceLastHint =
                    Date.now() - lastHintTimeRef.current;
                  if (timeSinceLastHint >= MIN_TIME_BETWEEN_HINTS) {
                    sendProactiveMessage(hint);
                    lastHintTimeRef.current = Date.now();
                  }
                }, INACTIVITY_TIMEOUT);
              }
            }

            // Handle tool calls
            if (message.toolCall) {
              console.log(
                "🔧 Voice session received tool call:",
                message.toolCall
              );
              
              // Emit tool call events for each function call
              if (message.toolCall.functionCalls) {
                for (const functionCall of message.toolCall.functionCalls) {
                  showEvent({
                    id: functionCall.id || `tool-${Date.now()}-${functionCall.name}`,
                    type: 'tool_call',
                    timestamp: Date.now(),
                    data: {
                      toolName: functionCall.name,
                      args: functionCall.args,
                    },
                  });
                }
              }
              
              await onToolCall(message.toolCall, sessionPromiseRef);
            }

            // Handle interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach((node) => node.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              // Clear partial transcript on interruption
              outputTranscriptAccumulatorRef.current = "";
              isAccumulatingTranscriptRef.current = false;
              setAppState(AppState.LISTENING);
            }
          },
          onclose: (event) => {
            const elapsed = Date.now() - sessionStartTimeRef.current;
            console.log("WebSocket close event:", event);
            
            // Handle specific close codes
            if (event.code === 1008) {
              addLog(`❌ Model not found. Please check your API key has access to the Gemini Live API.`);
            } else {
              addLog(`⚠️ Connection closed after ${Math.round(elapsed / 1000)}s`);
            }

            // Immediately stop audio sending when connection closes
            shouldSendAudioRef.current = false;
            if (audioWorkletNodeRef.current) {
              audioWorkletNodeRef.current.port.postMessage({
                type: "setShouldSend",
                value: false,
              });
            }

            // Clear transcript accumulator
            outputTranscriptAccumulatorRef.current = "";
            isAccumulatingTranscriptRef.current = false;

            // Clear duration check interval
            if (durationCheckIntervalRef.current) {
              clearInterval(durationCheckIntervalRef.current);
              durationCheckIntervalRef.current = null;
            }

            // Clear inactivity timer
            if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
              inactivityTimerRef.current = null;
            }

            setAppState(AppState.IDLE);
            sessionPromiseRef.current = null;
          },
          onerror: (err) => {
            console.error("Connection error details:", err);

            // Immediately stop audio sending on error
            shouldSendAudioRef.current = false;
            if (audioWorkletNodeRef.current) {
              audioWorkletNodeRef.current.port.postMessage({
                type: "setShouldSend",
                value: false,
              });
            }

            // More specific error handling
            const errorMsg = err?.message || err?.toString() || "Unknown error";
            const errorDetails = JSON.stringify(err, null, 2);
            console.error("Full error object:", errorDetails);

            if (errorMsg.toLowerCase().includes("not found") || errorMsg.toLowerCase().includes("entity")) {
              addLog(`❌ Model not found. Please ensure your API key has access to the Gemini Live API.`);
            } else if (errorMsg.toLowerCase().includes("quota")) {
              addLog(`❌ Quota exceeded. Please check your API limits.`);
            } else if (errorMsg.toLowerCase().includes("timeout")) {
              addLog(
                `❌ Connection timeout. The session may have exceeded the time limit.`
              );
            } else if (errorMsg.toLowerCase().includes("auth")) {
              addLog(`❌ Authentication failed. Please check your API key.`);
            } else if (errorMsg.toLowerCase().includes("permission")) {
              addLog(
                `❌ Microphone permission denied. Please allow microphone access.`
              );
            } else {
              addLog(`❌ Connection Error: ${errorMsg}`);
              console.error("Raw error:", err);
            }

            setAppState(AppState.ERROR);
            sessionPromiseRef.current = null;
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceSettings.voiceName },
            },
          },
          // Enable transcription of model's audio output
          outputAudioTranscription: {},
          // Configure Voice Activity Detection for better speech recognition
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              // @ts-expect-error - VAD sensitivity types may not be in current SDK version
              startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
              // @ts-expect-error - VAD sensitivity types may not be in current SDK version
              endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
              prefixPaddingMs: 20,
              silenceDurationMs: 100,
            },
          },
          systemInstruction: getSystemInstruction(),
          // @ts-ignore
          tools: (() => {
            const route = location.pathname;
            const searchParams = new URLSearchParams(location.search);
            const mode = searchParams.get("mode");
            const currentView = options?.currentView;

            // Landing page - navigation tools
            if (route === "/" || route === "") {
              return navigationTools;
            }

            // Generation mode - generation-specific tools
            if (mode === "generate") {
              return generationTools;
            }

            // Editor mode - get all tools first
            const allTools = getEnhancedGeminiTools({
              includeExamples: true,
              includeToolSearch: true,
            });

            // Filter tools based on current view using centralized filter
            const filteredTools = getToolsForView(currentView as any, allTools);

            return [
              {
                functionDeclarations: filteredTools,
              },
            ];
          })(),
        },
      });

      // Store the session promise immediately (before callbacks can fire)
      sessionPromiseRef.current = connectPromise;
      addLog("✓ Session promise stored");
    } catch (e: any) {
      console.error("Session start error:", e);
      const errorMsg = e?.message || e?.toString() || "Failed to start session";
      addLog(`❌ Start Error: ${errorMsg}`);
      setAppState(AppState.ERROR);

      // Clean up audio worklet if it was created
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.port.postMessage({
          type: "setShouldSend",
          value: false,
        });
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [setAppState, addLog, onToolCall, getSystemInstruction]);

  const stopSession = useCallback(() => {
    addLog("🛑 stopSession called");
    console.trace("stopSession call stack");

    // Clear voice search results when session ends
    setVoiceSearchResults(null);

    // Clear transcript accumulator
    outputTranscriptAccumulatorRef.current = "";
    isAccumulatingTranscriptRef.current = false;

    // Clear duration check interval
    if (durationCheckIntervalRef.current) {
      clearInterval(durationCheckIntervalRef.current);
      durationCheckIntervalRef.current = null;
    }

    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Disconnect audio nodes
    if (audioWorkletNodeRef.current) {
      // First pause audio processing
      audioWorkletNodeRef.current.port.postMessage({
        type: "setShouldSend",
        value: false,
      });
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current.port.onmessage = null;
      audioWorkletNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    shouldSendAudioRef.current = true;
    sessionPromiseRef.current = null;
    sessionStartTimeRef.current = 0;
    setAppState(AppState.IDLE);
  }, [setAppState, setVoiceSearchResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationCheckIntervalRef.current) {
        clearInterval(durationCheckIntervalRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Detect view changes and send contextual hints
  useEffect(() => {
    const currentView = options?.currentView;

    // Detect view change (not initial mount)
    if (
      previousViewRef.current !== null &&
      previousViewRef.current !== currentView &&
      sessionPromiseRef.current
    ) {
      const timeSinceLastSpeech = Date.now() - lastUserSpeechRef.current;
      const timeSinceLastHint = Date.now() - lastHintTimeRef.current;

      // Only send hint if:
      // 1. User hasn't spoken recently (not actively conversing)
      // 2. Enough time has passed since last hint (avoid spam)
      if (
        timeSinceLastSpeech >= MIN_SILENCE_FOR_HINT &&
        timeSinceLastHint >= MIN_TIME_BETWEEN_HINTS
      ) {
        // Wait for view to render, then send contextual hint
        setTimeout(() => {
          const hint = getContextualHint(currentView);
          if (hint) {
            sendProactiveMessage(hint);
            lastHintTimeRef.current = Date.now();
            addLog(`💡 Context hint: ${currentView || "gallery"}`);
          }
        }, CONTEXT_HINT_DELAY);
      } else {
        // User is actively talking or we just sent a hint - skip to avoid interruption
        console.debug("Skipping context hint - user active or hint too soon");
      }
    }

    previousViewRef.current = currentView;
  }, [options?.currentView, getContextualHint, sendProactiveMessage, addLog]);

  // Track the previous route to detect navigation
  const previousRouteRef = useRef<string>(location.pathname);

  // Detect route changes and update AI context
  useEffect(() => {
    const currentRoute = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    
    // Detect route change (not initial mount) and active session
    if (
      previousRouteRef.current !== currentRoute &&
      sessionPromiseRef.current
    ) {
      console.log(`🧭 Route changed from ${previousRouteRef.current} to ${currentRoute}`);
      
      // Send context update to AI
      let contextUpdate = "";
      
      if (currentRoute === "/" || currentRoute === "") {
        contextUpdate = "CONTEXT UPDATE: You are now on the landing page. Available tools: load_design_system, create_new_design_system, delete_design_system. You CANNOT edit tokens from here.";
      } else if (currentRoute === "/editor" && mode === "generate") {
        contextUpdate = "CONTEXT UPDATE: You are now in generation mode. Use generate_design_system tool to create a new design language from the user's description.";
      } else if (currentRoute === "/editor") {
        const languageName = currentLanguageMetadata?.name || "the design language";
        contextUpdate = `CONTEXT UPDATE: You are now in the editor for "${languageName}". You can search tokens, navigate views, update tokens, create tokens, analyze impact, and use all design system editing tools.`;
      }
      
      if (contextUpdate) {
        // Send context update silently to the AI
        setTimeout(() => {
          sendProactiveMessage(contextUpdate);
          addLog(`🧭 Context updated: ${currentRoute}`);
        }, 500); // Small delay to let navigation settle
      }
    }
    
    previousRouteRef.current = currentRoute;
  }, [location.pathname, location.search, currentLanguageMetadata?.name, sendProactiveMessage, addLog]);

  return {
    startSession,
    stopSession,
    sendProactiveMessage,
    sessionPromiseRef,
  };
};
