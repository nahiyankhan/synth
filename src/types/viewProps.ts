/**
 * Standardized View Component Props
 * 
 * Base interfaces that all view components should extend.
 * Ensures consistency across Color, Typography, Spacing, Components, Content views.
 */

import { StyleGraph } from '../core/StyleGraph';
import { StyleNode, StyleMode } from './styleGraph';

/**
 * Base props that ALL views should have
 */
export interface BaseViewProps {
  /** The design system graph containing all tokens */
  graph: StyleGraph;

  /** Current theme mode */
  viewMode: StyleMode;
}

/**
 * Props for views that support token selection
 */
export interface SelectableViewProps extends BaseViewProps {
  /** Callback when a token is selected */
  onSelectNode?: (node: StyleNode) => void;
}

/**
 * Props for views that support filtering/search
 */
export interface FilterableViewProps extends SelectableViewProps {
  /** Filtered nodes from search/voice commands */
  filteredNodes?: StyleNode[] | null;
  
  /** Callback to clear the filter */
  onClearFilter?: () => void;
}

/**
 * Standard props for canvas-based token views
 * (Colors, Typography, Spacing)
 */
export interface CanvasViewProps extends FilterableViewProps {
  // All canvas views use the same base props
  // Individual views can add type-specific props if needed
}

/**
 * Props for component showcase view
 */
export interface ComponentShowcaseViewProps extends BaseViewProps {
  // Components view might not need selection/filtering initially
  // But it follows the same base pattern
}

/**
 * Props for content/markdown views
 */
export interface ContentViewProps {
  /** Current theme mode */
  viewMode: StyleMode;

  // Note: ContentView uses contentService instead of StyleGraph
  // This is intentional as content guidelines are separate from tokens
}



