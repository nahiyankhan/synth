/**
 * Content Service
 * 
 * Semantic search and filtering for voice & tone guidelines using vector embeddings
 */

import { ContentChunk, ContentData, ContentSearchResult, TableOfContentsItem } from '../types/content';

let contentDataStore: ContentData | null = null;

/**
 * Initialize content service with data
 */
export function initContentService(contentData: ContentData | null): void {
  contentDataStore = contentData;
}

/**
 * Get current content data
 */
export function getContentData(): ContentData | null {
  return contentDataStore;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Search content using semantic similarity
 * Note: This function requires an embedding for the query.
 * For now, it performs text-based matching. Full semantic search requires API call.
 */
export function searchContent(
  query: string,
  topK: number = 5
): ContentChunk[] {
  if (!contentDataStore || !contentDataStore.chunks.length) {
    return [];
  }

  // Simple text-based search (fallback)
  // TODO: Implement proper embedding-based search with API
  const lowerQuery = query.toLowerCase();
  
  const matches = contentDataStore.chunks
    .filter(chunk => 
      chunk.text.toLowerCase().includes(lowerQuery) ||
      chunk.metadata.section?.toLowerCase().includes(lowerQuery)
    )
    .slice(0, topK);

  return matches;
}

/**
 * Search content using pre-computed embedding
 */
export function searchContentWithEmbedding(
  queryEmbedding: number[],
  topK: number = 5
): ContentSearchResult[] {
  if (!contentDataStore || !contentDataStore.chunks.length) {
    return [];
  }

  // Calculate similarity scores
  const scores = contentDataStore.chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by score and take top K
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, topK);
}

/**
 * Get content filtered by type
 */
export function getContentByType(
  type: 'rule' | 'example' | 'dont'
): ContentChunk[] {
  if (!contentDataStore || !contentDataStore.chunks.length) {
    return [];
  }

  return contentDataStore.chunks.filter(
    chunk => chunk.metadata.type === type
  );
}

/**
 * Get content filtered by section
 */
export function getContentBySection(section: string): ContentChunk[] {
  if (!contentDataStore || !contentDataStore.chunks.length) {
    return [];
  }

  return contentDataStore.chunks.filter(
    chunk => chunk.metadata.section === section
  );
}

/**
 * Get all unique sections
 */
export function getAllSections(): string[] {
  if (!contentDataStore || !contentDataStore.chunks.length) {
    return [];
  }

  const sections = new Set<string>();
  contentDataStore.chunks.forEach(chunk => {
    if (chunk.metadata.section) {
      sections.add(chunk.metadata.section);
    }
  });

  return Array.from(sections).sort();
}

/**
 * Get all chunks
 */
export function getAllContent(): ContentChunk[] {
  if (!contentDataStore || !contentDataStore.chunks.length) {
    return [];
  }

  return contentDataStore.chunks;
}

/**
 * Get content statistics
 */
export function getContentStats() {
  if (!contentDataStore || !contentDataStore.chunks.length) {
    return {
      total: 0,
      byType: { rule: 0, example: 0, dont: 0 },
      sections: 0,
    };
  }

  const byType = {
    rule: 0,
    example: 0,
    dont: 0,
  };

  contentDataStore.chunks.forEach(chunk => {
    if (chunk.metadata.type) {
      byType[chunk.metadata.type]++;
    }
  });

  return {
    total: contentDataStore.chunks.length,
    byType,
    sections: getAllSections().length,
  };
}

/**
 * Get markdown content
 */
export function getMarkdown(): string | null {
  return contentDataStore?.markdown || null;
}

/**
 * Extract table of contents from markdown
 */
export function extractTableOfContents(): TableOfContentsItem[] {
  const markdown = getMarkdown();
  if (!markdown) return [];

  const headings: TableOfContentsItem[] = [];
  const lines = markdown.split('\n');
  const stack: TableOfContentsItem[] = [];

  lines.forEach((line) => {
    // Match markdown headings
    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s+\{#([^}]+)\})?$/);
    if (match) {
      const [, hashes, title, id] = match;
      const level = hashes.length;
      
      const item: TableOfContentsItem = {
        id: id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        level,
        title: title.replace(/\*\*/g, '').trim(), // Remove bold markers
        children: [],
      };

      // Find parent
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        headings.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }

      stack.push(item);
    }
  });

  return headings;
}

