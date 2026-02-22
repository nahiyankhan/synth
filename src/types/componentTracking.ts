/**
 * Component Tracking Types
 *
 * Future system for tracking which components use which tokens.
 * This will replace the composite layer with actual component usage analysis.
 */

export interface ComponentToken {
  // Component identity
  componentPath: string; // 'src/components/Button.tsx'
  componentName: string; // 'Button', 'Card', 'Modal'

  // Token usage
  usedTokens: Set<string>; // Token IDs this component uses

  // Location info
  usageLocations: TokenUsageLocation[];
}

export interface TokenUsageLocation {
  filePath: string;
  line: number;
  column: number;
  context: string; // Code snippet showing usage
  tokenPath: string; // 'semantic.color.background.prominent'
}

/**
 * Component usage analysis result
 */
export interface ComponentImpactAnalysis {
  tokenId: string;
  affectedComponents: ComponentReference[];
  totalFiles: number;
  usageCount: number; // Total number of usages across all components
}

export interface ComponentReference {
  path: string;
  name: string;
  usageCount: number;
  locations: TokenUsageLocation[];
}

/**
 * Component scanner interface
 *
 * Implementations can scan different frameworks:
 * - React/React Native (.tsx, .jsx)
 * - SwiftUI (.swift)
 * - Jetpack Compose (.kt)
 */
export interface IComponentScanner {
  // Scan a directory for components
  scan(componentDir: string): Promise<ComponentToken[]>;

  // Find all usages of a specific token
  findUsages(tokenPath: string): Promise<TokenUsageLocation[]>;

  // Get impact of changing a token
  getImpactAnalysis(tokenId: string): Promise<ComponentImpactAnalysis>;
}

/**
 * Token usage in component code
 *
 * Examples:
 * - CSS: backgroundColor: tokens.semantic.background.app
 * - React Native: <View style={{ color: tokens.text.standard }} />
 * - Tailwind: className="bg-app text-standard"
 */
export interface TokenUsagePattern {
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => string; // Extract token path from match
}

// Common usage patterns for React/React Native
export const REACT_TOKEN_PATTERNS: TokenUsagePattern[] = [
  // tokens.semantic.color.background.app
  {
    pattern: /tokens\.([a-zA-Z0-9_.]+)/g,
    extract: (match) => match[1].replace(/_/g, '.')
  },
  // theme.colors.semantic.background.app
  {
    pattern: /theme\.colors\.([a-zA-Z0-9_.]+)/g,
    extract: (match) => match[1].replace(/_/g, '.')
  },
  // useToken('semantic.color.background.app')
  {
    pattern: /useToken\(['"]([a-zA-Z0-9_.]+)['"]\)/g,
    extract: (match) => match[1]
  }
];

/**
 * Future: Replace composite layer with this workflow
 *
 * OLD:
 *   Primitives → Utilities → Composites → Components
 *                                ↑ (predefined specs)
 *
 * NEW:
 *   Primitives → Utilities → Components
 *                                ↑ (scan actual usage)
 *
 * When you change semantic.background.app, show:
 *   • Button.tsx (3 usages)
 *   • Card.tsx (1 usage)
 *   • Modal.tsx (2 usages)
 */
