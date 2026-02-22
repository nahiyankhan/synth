import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useDesignLanguage } from "@/context/DesignLanguageContext";
import { useToolUI } from "@/context/ToolUIContext";
import {
  handleToolSearchCall,
  handleDesignSystemTool,
  isColorViewTool,
  isTypographyViewTool,
  isSpacingViewTool,
} from "@/toolCalls";
import {
  handleNavigationTool,
  isNavigationTool,
} from "@/toolCalls/navigationTools";
import { ColorViewToolHandlers } from "@/services/colorViewToolHandlers";
import { TypographyViewToolHandlers } from "@/services/typographyViewToolHandlers";
import { SpacingViewToolHandlers } from "@/services/spacingViewToolHandlers";
interface UseToolCallHandlerOptions {
  refreshUI: () => void;
  setActiveView?: (
    view: "gallery" | "colors" | "typography" | "sizes" | "components" | "content"
  ) => void;
  setMultiView?: (left: string, right: string) => void;
}

/**
 * Custom hook that handles routing of tool calls to appropriate handlers.
 * Encapsulates all tool routing logic, keeping pages clean and focused on UI.
 *
 * Returns a handler function that accepts (toolCall, sessionPromiseRef) to avoid circular deps.
 */
export function useToolCallHandler({
  refreshUI,
  setActiveView,
  setMultiView,
}: UseToolCallHandlerOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addLog } = useApp();
  const { graph, toolHandlers, setVoiceSearchResults, setSelectedLanguage, setSelectedNodes, setAutoSelectFilteredNodes } =
    useDesignLanguage();
  const { showResult } = useToolUI();

  return useCallback(
    async (toolCall: any, sessionPromiseRef: React.MutableRefObject<any> | null = null) => {
      console.log("🔧 handleToolCall called:", toolCall);

      try {
        const functionCall = toolCall.functionCalls[0];
        console.log("🔧 Function call:", functionCall);
        addLog(`🔧 ${functionCall.name}...`);

        // Handle navigation tools
        // create_new_design_system can be called from anywhere
        // Other navigation tools only work on landing page
        if (functionCall.name === "create_new_design_system" || 
            location.pathname === "/" || 
            location.pathname === "") {
          if (isNavigationTool(functionCall.name)) {
            await handleNavigationTool({
              functionCall,
              addLog,
              showResult,
              navigate,
              setSelectedLanguage,
              sessionPromiseRef,
            });
            return;
          }
        }

        // Check if we're in generation mode
        const searchParams = new URLSearchParams(location.search);
        const mode = searchParams.get("mode");

        // In generation mode, generate_design_system is handled in EditorPage
        // Don't process other tools here as there's no graph/toolHandlers yet
        if (mode === "generate") {
          addLog(
            "⚠️ Tool called in generation mode - should be handled by EditorPage"
          );
          console.warn("Tool called in generation mode:", functionCall.name);
          return;
        }

        if (!toolHandlers) {
          addLog("❌ Tool handlers not initialized");
          console.error("❌ Tool handlers not initialized");
          return;
        }

        // Handle tool search (lazy loading)
        if (functionCall.name === "search_tools") {
          await handleToolSearchCall({
            args: functionCall.args,
            functionCall,
            sessionPromiseRef,
            addLog,
            showResult,
          });
          return;
        }

        // Handle view navigation
        if (functionCall.name === "navigate_to_view") {
          const { view } = functionCall.args || {};

          if (!setActiveView) {
            addLog("❌ View navigation not available");
            return;
          }

          if (
            !view ||
            ![
              "gallery",
              "colors",
              "typography",
              "sizes",
              "components",
              "content",
              "pages",
            ].includes(view)
          ) {
            addLog(`❌ Invalid view: ${view}`);
            return;
          }

          setActiveView(view);
          addLog(`✓ Switched to ${view} view`);

          // Send response back to AI
          if (sessionPromiseRef?.current) {
            const session = await sessionPromiseRef.current;
            session.sendToolResponse({
              functionResponses: [
                {
                  id: functionCall.id,
                  name: functionCall.name,
                  response: {
                    success: true,
                    view,
                    message: `Navigated to ${view} view`,
                  },
                },
              ],
            });
          }
          return;
        }

        // Handle split view navigation
        if (functionCall.name === "show_split_view") {
          const { left, right } = functionCall.args || {};

          if (!setMultiView) {
            addLog("❌ Split view not available");
            return;
          }

          const validViews = ["colors", "typography", "sizes", "components", "content", "pages"];
          
          if (!left || !validViews.includes(left)) {
            addLog(`❌ Invalid left view: ${left}`);
            return;
          }

          if (!right || !validViews.includes(right)) {
            addLog(`❌ Invalid right view: ${right}`);
            return;
          }

          if (left === right) {
            addLog(`❌ Cannot show the same view twice`);
            return;
          }

          setMultiView(left, right);
          addLog(`✓ Showing ${left} and ${right} side by side`);

          // Send response back to AI
          if (sessionPromiseRef?.current) {
            const session = await sessionPromiseRef.current;
            session.sendToolResponse({
              functionResponses: [
                {
                  id: functionCall.id,
                  name: functionCall.name,
                  response: {
                    success: true,
                    left,
                    right,
                    message: `Split view: ${left} | ${right}`,
                  },
                },
              ],
            });
          }
          return;
        }

        // Handle ColorView tools
        if (isColorViewTool(functionCall.name)) {
          if (!graph) {
            addLog("❌ Graph not loaded");
            return;
          }

          const colorViewHandlers = new ColorViewToolHandlers(graph);
          let result;

          switch (functionCall.name) {
            case "find_similar_colors":
              result = await colorViewHandlers.findSimilarColors(
                functionCall.args
              );
              break;
            case "adjust_colors_lightness":
              result = await colorViewHandlers.adjustColorsLightness(
                functionCall.args
              );
              break;
            case "generate_color_scale":
              result = await colorViewHandlers.generateColorScale(
                functionCall.args
              );
              break;
            case "check_lightness_scale":
              result = await colorViewHandlers.checkLightnessScale(
                functionCall.args
              );
              break;
            case "check_color_contrast":
              result = await colorViewHandlers.checkColorContrast(
                functionCall.args
              );
              break;
            case "group_colors_by_hue":
              result = await colorViewHandlers.groupColorsByHue(
                functionCall.args
              );
              break;
            case "select_colors":
              result = await colorViewHandlers.selectColors(
                functionCall.args
              );
              break;
            default:
              result = {
                success: false,
                error: `Unknown ColorView tool: ${functionCall.name}`,
              };
          }

          if (!result.success) {
            addLog(`❌ ${result.error}`);
          } else {
            addLog(`✓ ${result.message}`);

            // Handle select_colors specially - filter and mark for auto-selection
            if (functionCall.name === "select_colors" && result.nodeIds) {
              // Get the actual node objects from the graph
              const nodesToSelect = result.nodeIds
                .map((id: string) => graph.getNode(id))
                .filter(Boolean);
              
              // Set flag to trigger auto-selection in ColorView
              setAutoSelectFilteredNodes(true);
              
              // Set filtered nodes (this will show them in the view)
              setVoiceSearchResults(nodesToSelect);
              
              // Also set them as selected in the context
              setSelectedNodes(result.nodeIds);
              
              // Reset the flag after a brief delay (let ColorView effect run first)
              setTimeout(() => {
                setAutoSelectFilteredNodes(false);
              }, 100);
              
              if (nodesToSelect.length > 0) {
                addLog(`Selected ${nodesToSelect.length} color${nodesToSelect.length !== 1 ? 's' : ''}`);
              }
            }
            // Show result in overlay for other color tools
            else if (result.data) {
              showResult({
                type: "color-proposal",
                timestamp: Date.now(),
                toolName: functionCall.name,
                colorProposal: result.data,
              });
            }
          }

          // Send response to AI
          if (sessionPromiseRef?.current) {
            const session = await sessionPromiseRef.current;
            session.sendToolResponse({
              functionResponses: [
                {
                  id: functionCall.id,
                  name: functionCall.name,
                  response: result.data || {
                    success: result.success,
                    error: result.error,
                  },
                },
              ],
            });
          }

          return;
        }

        // Handle TypographyView tools
        if (isTypographyViewTool(functionCall.name)) {
          if (!graph) {
            addLog("❌ Graph not loaded");
            return;
          }

          const typographyViewHandlers = new TypographyViewToolHandlers(graph);
          let result;

          switch (functionCall.name) {
            case "analyze_type_scale":
              result = await typographyViewHandlers.analyzeTypeScale(
                functionCall.args
              );
              break;
            case "check_readability":
              result = await typographyViewHandlers.checkReadability(
                functionCall.args
              );
              break;
            case "suggest_type_hierarchy":
              result = await typographyViewHandlers.suggestTypeHierarchy(
                functionCall.args
              );
              break;
            case "analyze_letter_spacing":
              result = await typographyViewHandlers.analyzeLetterSpacing(
                functionCall.args
              );
              break;
            default:
              result = {
                success: false,
                error: `Unknown TypographyView tool: ${functionCall.name}`,
              };
          }

          if (!result.success) {
            addLog(`❌ ${result.error}`);
          } else {
            addLog(`✓ Typography analysis completed`);

            // Show result in overlay
            if (result.visualFeedback) {
              showResult({
                type: "typography-analysis",
                timestamp: Date.now(),
                toolName: functionCall.name,
                data: result.visualFeedback.data,
              });
            }
          }

          // Send response to AI
          if (sessionPromiseRef?.current) {
            const session = await sessionPromiseRef.current;
            session.sendToolResponse({
              functionResponses: [
                {
                  id: functionCall.id,
                  name: functionCall.name,
                  response: result.result || {
                    success: result.success,
                    error: result.error,
                  },
                },
              ],
            });
          }

          return;
        }

        // Handle SpacingView tools
        if (isSpacingViewTool(functionCall.name)) {
          if (!graph) {
            addLog("❌ Graph not loaded");
            return;
          }

          const spacingViewHandlers = new SpacingViewToolHandlers(graph);
          let result;

          switch (functionCall.name) {
            case "analyze_spacing_scale":
              result = await spacingViewHandlers.analyzeSpacingScale(
                functionCall.args
              );
              break;
            case "check_spacing_consistency":
              result = await spacingViewHandlers.checkSpacingConsistency(
                functionCall.args
              );
              break;
            case "suggest_spacing_tokens":
              result = await spacingViewHandlers.suggestSpacingTokens(
                functionCall.args
              );
              break;
            case "validate_size_harmony":
              result = await spacingViewHandlers.validateSizeHarmony(
                functionCall.args
              );
              break;
            default:
              result = {
                success: false,
                error: `Unknown SpacingView tool: ${functionCall.name}`,
              };
          }

          if (!result.success) {
            addLog(`❌ ${result.error}`);
          } else {
            addLog(`✓ Spacing analysis completed`);

            // Show result in overlay
            if (result.visualFeedback) {
              showResult({
                type: "spacing-analysis",
                timestamp: Date.now(),
                toolName: functionCall.name,
                data: result.visualFeedback.data,
              });
            }
          }

          // Send response to AI
          if (sessionPromiseRef?.current) {
            const session = await sessionPromiseRef.current;
            session.sendToolResponse({
              functionResponses: [
                {
                  id: functionCall.id,
                  name: functionCall.name,
                  response: result.result || {
                    success: result.success,
                    error: result.error,
                  },
                },
              ],
            });
          }

          return;
        }

        // Handle regular design system tools
        await handleDesignSystemTool({
          functionCall,
          toolHandlers,
          sessionPromiseRef,
          addLog,
          graph,
          refreshUI,
          setVoiceSearchResults,
          showResult,
        });
      } catch (error: any) {
        console.error("Tool call error:", error);
        addLog(`❌ Tool error: ${error.message}`);
      }
    },
    [
      location,
      toolHandlers,
      addLog,
      graph,
      refreshUI,
      setVoiceSearchResults,
      showResult,
      navigate,
      setActiveView,
    ]
  );
}
