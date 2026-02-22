/**
 * useEditorViews Hook
 * 
 * Manages editor view state through URL query parameters.
 * Supports both single-view and multi-view layouts.
 * 
 * Examples:
 * - /editor                          → Gallery overview
 * - /editor?view=colors              → Single colors view
 * - /editor?left=colors&right=typography  → Side-by-side (future)
 * - /editor?views=colors,typography,sizes → Multi-view grid (future)
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export type EditorViewType =
  | 'colors'
  | 'typography'
  | 'sizes'
  | 'components'
  | 'content'
  | 'pages'
  | 'visual-direction'
  | 'motion';

export type LayoutType = 'single' | 'split' | 'grid';

interface EditorViewState {
  // Current view mode
  isSingleView: boolean;
  isMultiView: boolean;
  isGalleryView: boolean;
  
  // Single view
  currentView: EditorViewType | null;
  
  // Multi-view (future support)
  leftView: EditorViewType | null;
  rightView: EditorViewType | null;
  allViews: EditorViewType[];
  
  // Layout
  layout: LayoutType;
  
  // Navigation helpers
  setView: (view: EditorViewType | null) => void;
  setMultiView: (left: EditorViewType, right: EditorViewType) => void;
  clearViews: () => void;
}

export function useEditorViews(): EditorViewState {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read current state from URL
  const view = searchParams.get('view') as EditorViewType | null;
  const leftView = searchParams.get('left') as EditorViewType | null;
  const rightView = searchParams.get('right') as EditorViewType | null;
  const viewsParam = searchParams.get('views');
  const layout = (searchParams.get('layout') || 'single') as LayoutType;
  
  // Parse multi-view from comma-separated string
  const allViews: EditorViewType[] = viewsParam 
    ? viewsParam.split(',').filter(Boolean) as EditorViewType[]
    : [];
  
  // Determine view mode
  const isSingleView = !!view && !leftView && !rightView && allViews.length === 0;
  const isMultiView = !!(leftView || rightView || allViews.length > 0);
  const isGalleryView = !view && !leftView && !rightView && allViews.length === 0;
  
  // Get current view (prioritize single view, then left view, then first in array)
  const currentView = view || leftView || (allViews.length > 0 ? allViews[0] : null);
  
  // Navigation helper - set single view
  const setView = useCallback((newView: EditorViewType | null) => {
    const newParams = new URLSearchParams();
    
    if (newView) {
      newParams.set('view', newView);
    }
    // If newView is null, we clear all params (back to gallery)
    
    setSearchParams(newParams);
  }, [setSearchParams]);
  
  // Navigation helper - set multi-view (future)
  const setMultiView = useCallback((left: EditorViewType, right: EditorViewType) => {
    const newParams = new URLSearchParams();
    newParams.set('left', left);
    newParams.set('right', right);
    newParams.set('layout', 'split');
    
    setSearchParams(newParams);
  }, [setSearchParams]);
  
  // Navigation helper - clear all views (back to gallery)
  const clearViews = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);
  
  return {
    isSingleView,
    isMultiView,
    isGalleryView,
    currentView,
    leftView,
    rightView,
    allViews,
    layout,
    setView,
    setMultiView,
    clearViews,
  };
}

