/**
 * Tool handlers for design generation mode
 */

interface GenerateDesignSystemArgs {
  prompt: string;
}

interface HandleGenerationToolOptions {
  functionCall: any;
  addLog: (message: string) => void;
  generate: (prompt: string) => void;
  sessionPromiseRef: React.MutableRefObject<any> | null;
}

/**
 * Check if a tool name is a generation tool
 */
export function isGenerationTool(toolName: string): boolean {
  return toolName === "generate_design_system";
}

/**
 * Handle generation mode tool calls
 */
export async function handleGenerationTool({
  functionCall,
  addLog,
  generate,
  sessionPromiseRef,
}: HandleGenerationToolOptions) {
  const { name, args } = functionCall;

  try {
    switch (name) {
      case "generate_design_system": {
        const { prompt } = args as GenerateDesignSystemArgs;
        
        addLog(`🎨 Generating design system: "${prompt}"`);
        
        // Trigger the generation
        generate(prompt);
        
        // Send response back to voice AI
        if (sessionPromiseRef?.current) {
          try {
            const session = await sessionPromiseRef.current;
            if (session) {
              session.sendToolResponse({
                functionResponses: [
                  {
                    name,
                    response: {
                      success: true,
                      message: `Started generating design system based on: "${prompt}"`,
                      status: "generating",
                    },
                  },
                ],
              });
            }
          } catch (error) {
            console.error("Error sending tool response:", error);
          }
        }
        
        break;
      }

      default:
        console.warn(`Unknown generation tool: ${name}`);
        addLog(`⚠️ Unknown tool: ${name}`);
        
        // Send error response
        if (sessionPromiseRef?.current) {
          try {
            const session = await sessionPromiseRef.current;
            if (session) {
              session.sendToolResponse({
                functionResponses: [
                  {
                    name,
                    response: {
                      success: false,
                      error: `Unknown tool: ${name}`,
                    },
                  },
                ],
              });
            }
          } catch (error) {
            console.error("Error sending error response:", error);
          }
        }
    }
  } catch (error: any) {
    console.error(`Error executing generation tool ${name}:`, error);
    addLog(`❌ Tool error: ${error.message || "Unknown error"}`);
    
    // Send error response to AI
    if (sessionPromiseRef?.current) {
      try {
        const session = await sessionPromiseRef.current;
        if (session) {
          session.sendToolResponse({
            functionResponses: [
              {
                name,
                response: {
                  success: false,
                  error: error.message || "Unknown error",
                },
              },
            ],
          });
        }
      } catch (sendError) {
        console.error("Error sending error response:", sendError);
      }
    }
  }
}

