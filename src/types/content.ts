/**
 * Content (Voice & Tone) Types
 */

export interface TableOfContentsItem {
  id: string;
  level: number;
  title: string;
  children: TableOfContentsItem[];
}

export interface ContentData {
  markdown?: string;
}
