/**
 * Text Audit Service
 *
 * Audits user-written text against voice & tone guidelines using AI embeddings
 */

import { GoogleGenAI } from "@google/genai";
import { ContentSearchResult } from '../types/content';
import { searchContentWithEmbedding } from './contentService';
import { getApiKey } from "../utils/apiKeyStorage";

export interface TextAuditResult {
  matches: ContentSearchResult[];
  summary: string;
  isAuditing: boolean;
  error?: string;
}

/**
 * Generate embedding for user text using Gemini API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error("API Key missing. Please set your API key in settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: [text],
  });

  // Extract embedding from response
  const embedding = response.embeddings?.[0]?.values;
  
  if (!embedding || embedding.length === 0) {
    throw new Error("Failed to generate embedding");
  }
  
  return embedding;
}

/**
 * Audit user text against content guidelines
 * Returns relevant guidelines that apply to the text
 */
export async function auditText(text: string, topK: number = 5): Promise<TextAuditResult> {
  try {
    if (!text.trim()) {
      return {
        matches: [],
        summary: "Enter some text to audit it against the guidelines.",
        isAuditing: false,
      };
    }

    // Generate embedding for user text
    const embedding = await generateEmbedding(text);
    
    // Search for relevant content chunks
    const matches = searchContentWithEmbedding(embedding, topK);
    
    // Generate a summary
    let summary = "";
    if (matches.length === 0) {
      summary = "No relevant guidelines found for this text.";
    } else {
      const topScore = matches[0]?.score || 0;
      if (topScore > 0.7) {
        summary = `✓ This text strongly aligns with ${matches.length} guideline(s).`;
      } else if (topScore > 0.5) {
        summary = `⚠ This text moderately aligns with ${matches.length} guideline(s). Review recommendations below.`;
      } else {
        summary = `✘ This text has weak alignment with guidelines. Consider revising based on recommendations below.`;
      }
    }
    
    return {
      matches,
      summary,
      isAuditing: false,
    };
  } catch (error) {
    console.error('Text audit failed:', error);
    return {
      matches: [],
      summary: "",
      isAuditing: false,
      error: error instanceof Error ? error.message : 'Audit failed',
    };
  }
}

/**
 * Search result for content guidelines
 */
export interface ContentSearchResponse {
  results: ContentSearchResult[];
  query: string;
  error?: string;
}

/**
 * Search content guidelines using semantic similarity
 * Takes a query string, generates an embedding, and finds relevant guidelines
 */
export async function searchGuidelines(query: string, topK: number = 10): Promise<ContentSearchResponse> {
  try {
    if (!query.trim()) {
      return {
        results: [],
        query,
      };
    }

    // Generate embedding for query
    const embedding = await generateEmbedding(query);

    // Search for relevant content chunks
    const results = searchContentWithEmbedding(embedding, topK);

    return {
      results,
      query,
    };
  } catch (error) {
    console.error('Content search failed:', error);
    return {
      results: [],
      query,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Highlight text spans that match specific guidelines
 * This is a simple implementation - can be enhanced with more sophisticated matching
 */
export function highlightRelevantSpans(text: string, matches: ContentSearchResult[]): Array<{
  start: number;
  end: number;
  matchId: string;
  snippet: string;
}> {
  const highlights: Array<{
    start: number;
    end: number;
    matchId: string;
    snippet: string;
  }> = [];

  // For each match, find overlapping phrases/words in the user text
  matches.forEach((match) => {
    // Extract key phrases from the guideline (simple word matching)
    const guidelineWords = match.text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4); // Only meaningful words
    
    const textLower = text.toLowerCase();
    
    guidelineWords.forEach(word => {
      let index = textLower.indexOf(word);
      while (index !== -1) {
        highlights.push({
          start: index,
          end: index + word.length,
          matchId: match.id,
          snippet: word,
        });
        index = textLower.indexOf(word, index + 1);
      }
    });
  });

  // Sort by position
  highlights.sort((a, b) => a.start - b.start);
  
  return highlights;
}

