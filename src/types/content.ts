/**
 * Content (Voice & Tone) Types
 * 
 * Types for voice and tone guidelines with vector embeddings for semantic search
 */

export interface MarkdownRange {
  start: number;
  end: number;
  headingId?: string;
}

export interface ContentChunk {
  id: string;
  text: string;
  metadata: {
    section?: string;
    type?: 'rule' | 'example' | 'dont';
    pageNumber?: number;
    markdownRange?: MarkdownRange;
  };
  embedding: number[];
}

export interface ContentData {
  markdown?: string; // Full markdown document
  chunks: ContentChunk[];
}

export interface ContentSearchResult extends ContentChunk {
  score: number; // Cosine similarity score
}

export interface TableOfContentsItem {
  id: string;
  level: number;
  title: string;
  children: TableOfContentsItem[];
}

