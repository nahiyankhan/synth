/**
 * UI Generation Orchestrator
 *
 * Generates UI component trees from natural language descriptions.
 * Uses Anthropic Claude with streamText and JSONL patches (like json-render).
 * Outputs UITree in flat format (root key + elements map).
 */

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { UITree, UIElement } from '@json-render/core';

// =============================================================================
// Types
// =============================================================================

export type UIStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'stream'; content: string }
  | { type: 'complete'; result: UITree; metadata: { componentCount: number } }
  | { type: 'error'; message: string; details?: string };

export interface UIGenerationOptions {
  /** Natural language prompt describing the UI to generate */
  prompt: string;
  /** Optional token context section generated from design language */
  tokenContext?: string;
}

// =============================================================================
// Prompt (adapted from json-render)
// =============================================================================

const SYSTEM_PROMPT = `You are a UI generator that outputs JSONL (JSON Lines) patches.

AVAILABLE COMPONENTS (30):

Layout:
- Card: { title?: string, description?: string, maxWidth?: "sm"|"md"|"lg"|"full", centered?: boolean } - Container card. Has children.
- Stack: { direction?: "horizontal"|"vertical", gap?: "sm"|"md"|"lg" } - Flex container. Has children.
- Grid: { columns?: 1|2|3|4, gap?: "sm"|"md"|"lg" } - Grid layout. Has children. Use columns:1 + className for responsive.
- Divider: {} - Horizontal separator line

Form Inputs:
- Input: { label: string, name: string, type?: "text"|"email"|"password"|"number", placeholder?: string }
- Textarea: { label: string, name: string, placeholder?: string, rows?: number }
- Select: { label?: string, name?: string, options: string[], placeholder?: string }
- Checkbox: { label: string, name: string, checked?: boolean }
- Radio: { label: string, name: string, options: string[] }
- Switch: { label: string, name: string, checked?: boolean }
- DatePicker: { label: string, valuePath: string } - Date input with data binding

Actions:
- Button: { label: string, variant?: "primary"|"secondary"|"danger"|"ghost", action?: { name: string } }
- Link: { label: string, href: string }

Typography:
- Heading: { text: string, level?: 1|2|3|4 }
- Text: { content: string, variant?: "body"|"caption"|"muted" }

Data Display:
- Image: { src: string, alt: string, width?: number, height?: number }
- Avatar: { src?: string, name: string, size?: "sm"|"md"|"lg" }
- Badge: { text: string, variant?: "default"|"success"|"warning"|"danger"|"info" }
- Alert: { title: string, message?: string, type?: "info"|"success"|"warning"|"error" }
- Progress: { value: number, max?: number, label?: string }
- Rating: { value: number, max?: number, label?: string }
- Empty: { title: string, description?: string }

Charts:
- BarGraph: { title?: string, data: Array<{label: string, value: number}> }
- LineGraph: { title?: string, data: Array<{label: string, value: number}> }
- Chart: { type: "bar"|"line", dataPath: string, title?: string } - Data-bound chart

Data Components:
- Metric: { label: string, valuePath: string, format?: "number"|"currency"|"percent", trend?: "up"|"down", trendValue?: string }
- Table: { title?: string, dataPath: string, columns: Array<{key: string, label: string, format?: "text"|"currency"|"date"|"badge"}> }
- List: { dataPath: string } - Renders list from data. Has children.

Utility:
- Form: { title?: string } - Form wrapper. Has children.

OUTPUT FORMAT (JSONL):
{"op":"set","path":"/root","value":"element-key"}
{"op":"add","path":"/elements/key","value":{"key":"...","type":"...","props":{...},"children":[...]}}

ALL COMPONENTS support: className?: string[] - array of Tailwind classes

RULES:
1. First line sets /root to root element key
2. Add elements with /elements/{key}
3. Children array contains string keys, not objects
4. Parent first, then children
5. Each element needs: key, type, props
6. Use className for custom Tailwind styling

MOBILE-FIRST:
- Design mobile-first. Single column on mobile, expand on larger screens.
- Grid: Use columns:1, add className:["sm:grid-cols-2"] for larger screens
- Horizontal stacks: use className:["flex-wrap"]

EXAMPLE (Settings card):
{"op":"set","path":"/root","value":"card"}
{"op":"add","path":"/elements/card","value":{"key":"card","type":"Card","props":{"title":"Settings"},"children":["stack"]}}
{"op":"add","path":"/elements/stack","value":{"key":"stack","type":"Stack","props":{"direction":"vertical","gap":"md"},"children":["switch1","switch2"]}}
{"op":"add","path":"/elements/switch1","value":{"key":"switch1","type":"Switch","props":{"label":"Email notifications","name":"email"}}}
{"op":"add","path":"/elements/switch2","value":{"key":"switch2","type":"Switch","props":{"label":"Push notifications","name":"push"}}}

Generate JSONL:`;

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

// =============================================================================
// JSONL Parser
// =============================================================================

interface JSONLPatch {
  op: 'set' | 'add';
  path: string;
  value: unknown;
}

function parseJSONL(content: string): UITree {
  const tree: UITree = { root: '', elements: {} };
  const lines = content.split('\n').filter(line => line.trim());

  for (const line of lines) {
    try {
      const patch = JSON.parse(line) as JSONLPatch;

      if (patch.path === '/root') {
        tree.root = patch.value as string;
      } else if (patch.path.startsWith('/elements/')) {
        const element = patch.value as UIElement;
        tree.elements[element.key] = element;
      }
    } catch {
      // Skip invalid lines
    }
  }

  return tree;
}

// =============================================================================
// Orchestrator
// =============================================================================

export class UIOrchestrator {
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  /**
   * Generate UI tree from a natural language prompt
   */
  async *generateUI(options: UIGenerationOptions | string): AsyncGenerator<UIStreamEvent> {
    const { prompt, tokenContext } = typeof options === 'string'
      ? { prompt: options, tokenContext: undefined }
      : options;

    yield { type: 'status', message: 'Generating UI...' };

    try {
      // Build prompt with optional token context
      let userPrompt = prompt;
      if (tokenContext) {
        userPrompt = `${tokenContext}\n\nUSER REQUEST: ${prompt}`;
      }

      const result = streamText({
        model: anthropic(this.model),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.7,
      });

      // Accumulate streamed content
      let fullContent = '';

      for await (const chunk of result.textStream) {
        fullContent += chunk;

        // Stream partial content for live preview
        yield { type: 'stream', content: fullContent };
      }

      // Parse final JSONL to UITree
      const tree = parseJSONL(fullContent);
      const componentCount = Object.keys(tree.elements).length;

      if (!tree.root || componentCount === 0) {
        yield {
          type: 'error',
          message: 'Failed to parse generated UI',
          details: 'No valid components found in output',
        };
        return;
      }

      yield {
        type: 'complete',
        result: tree,
        metadata: { componentCount },
      };
    } catch (error) {
      console.error('UI generation error:', error);
      yield {
        type: 'error',
        message: 'Failed to generate UI',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
