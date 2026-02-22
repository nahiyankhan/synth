/**
 * Session Name Service
 *
 * Uses AI SDK v6 with Gemini to generate descriptive session titles
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getApiKey } from "../utils/apiKeyStorage";

export const generateSessionName = async (prompts: string[]): Promise<string> => {
  if (prompts.length === 0) {
    return 'Untitled Session';
  }

  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    // Fallback to a simple name if no API key
    return prompts[0].substring(0, 50) + (prompts[0].length > 50 ? '...' : '');
  }

  try {
    // Use Gemini 3 Flash for cost-effective session naming
    const googleProvider = createGoogleGenerativeAI({ apiKey });
    const model = googleProvider('gemini-3-flash-preview');
    
    const result = await generateText({
      model,
      prompt: `Based on these image generation/editing prompts, create a brief descriptive title for this creative session. The title should be 3-5 words maximum, concise and capturing the main theme or subject.

Focus on design system terminology when applicable (tokens, primitives, utilities, palette, scale, components).

Prompts:
${prompts.join('\n')}

Return ONLY the title, nothing else.`,
      maxTokens: 50,
    });

    const generatedName = result.text.trim();
    
    if (generatedName && generatedName.length > 0) {
      // Clean up the name (remove quotes, limit length)
      let cleanName = generatedName.replace(/^["']|["']$/g, '').trim();
      
      // Limit to reasonable length
      if (cleanName.length > 50) {
        cleanName = cleanName.substring(0, 50) + '...';
      }
      
      return cleanName;
    }
    
    // Fallback to first prompt if generation failed
    return prompts[0].substring(0, 50) + (prompts[0].length > 50 ? '...' : '');
  } catch (error) {
    console.error('Failed to generate session name:', error);
    // Fallback to first prompt
    return prompts[0].substring(0, 50) + (prompts[0].length > 50 ? '...' : '');
  }
};
