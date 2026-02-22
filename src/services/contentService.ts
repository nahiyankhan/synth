/**
 * Content Service
 *
 * Voice & tone guidelines display
 */

import { TableOfContentsItem } from '../types/content';

let markdownContent: string | null = null;

/**
 * Initialize content service with markdown
 */
export function initContentService(markdown: string | null): void {
  markdownContent = markdown;
}

/**
 * Get markdown content
 */
export function getMarkdown(): string | null {
  return markdownContent;
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

