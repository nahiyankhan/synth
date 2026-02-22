/**
 * TableOfContents - Navigation sidebar for markdown document
 */

import React, { useState, useEffect } from 'react';
import { TableOfContentsItem } from '@/types/content';

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  className = '',
  scrollContainerRef,
}) => {
  const [activeId, setActiveId] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Track scroll position to highlight current section
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      const headings = container.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
      const scrollPosition = container.scrollTop + 100;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i] as HTMLElement;
        const headingTop = heading.offsetTop - container.offsetTop;
        if (headingTop <= scrollPosition) {
          setActiveId(heading.id);
          break;
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scrollToHeading = (id: string) => {
    const container = scrollContainerRef?.current;
    const element = document.getElementById(id);
    
    if (container && element) {
      const offset = 20; // Small offset from the top
      const elementPosition = element.offsetTop - container.offsetTop - offset;
      container.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  const renderItem = (item: TableOfContentsItem) => {
    const isActive = activeId === item.id;
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = item.children.length > 0;

    return (
      <li key={item.id} className="mb-1">
        <div className="flex items-start">
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="shrink-0 w-4 h-6 flex items-center justify-center text-dark-400 hover:text-dark-600 transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => scrollToHeading(item.id)}
            className={`flex-1 text-left text-sm transition-colors ${
              hasChildren ? '' : 'ml-4'
            } ${
              isActive
                ? 'text-dark-900 font-medium'
                : 'text-dark-600 hover:text-dark-900'
            }`}
            style={{
              paddingLeft: `${(item.level - 1) * 0.75}rem`,
            }}
          >
            {item.title}
          </button>
        </div>
        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1">
            {item.children.map(child => renderItem(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className={`${className}`}>
      <div className="sticky top-4">
        <div className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">
          Contents
        </div>
        <ul className="space-y-1">
          {items.map(item => renderItem(item))}
        </ul>
      </div>
    </nav>
  );
};

