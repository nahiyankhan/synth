/**
 * AI Tool Definitions for Design Generation (Creation Page)
 */

export const generationTools = [
  {
    functionDeclarations: [
      {
        name: "generate_design_system",
        description:
          "Generate a new design system based on the user's description. This starts the full generation process with strategy, identity, colors, and typography. Call this immediately when the user describes what kind of design language they want - no need to gather more details.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            prompt: {
              type: "STRING" as const,
              description:
                "The user's description of the design system they want. Can be a vibe, style, industry, or any descriptive text (e.g., 'minimalist and clean', 'bold fintech app', 'warm healthcare product', 'technical dashboard')",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  },
];

/**
 * Get system instructions for generation page context
 */
export function getGenerationModeInstructions(): string {
  return `You help users create design systems. The user sees:
- Screen prompt: "What kind of vibe are you going for?"
- Four cards: Minimalist, Bold, Organic, Technical

YOUR TASK:
1. Ask: "What kind of vibe are you going for?"
2. User describes vibe → Call generate_design_system with their words
3. Say "Generating" or "On it"

TOOL:
- generate_design_system(prompt: string) - Takes ANY vibe description and generates design system
- You HAVE this tool - use it immediately when user describes a vibe
- Works with: "minimalist", "bold fintech", "calm healthcare app", "dark technical", etc.

EXAMPLES:

User: "minimalist"
→ Call generate_design_system(prompt: "minimalist")
→ Say: "Generating"

User: "bold fintech"
→ Call generate_design_system(prompt: "bold fintech")
→ Say: "On it"

User: "not sure"
→ Say: "Try Minimalist, Bold, Organic, or Technical"

User: "technical"
→ Call generate_design_system(prompt: "technical")
→ Say: "Creating"

User: "modern healthcare app"
→ Call generate_design_system(prompt: "modern healthcare app")
→ Say: "Generating"

Keep it simple:
- Capture their exact words in prompt
- Call the tool immediately
- 1-3 word responses
- No asking permission, no explanations
`;
}
