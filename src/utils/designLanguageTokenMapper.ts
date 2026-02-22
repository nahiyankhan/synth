/**
 * Design Language Token Mapper
 * 
 * Utilities for mapping between design system tokens and CSS variables
 */

/**
 * Convert a design system node name to a CSS variable name
 * Example: "base.color.constant.black" -> "dl-black"
 * Example: "semantic.color.text.standard" -> "dl-text-standard"
 */
export function nodeNameToCSSVarName(name: string): string {
  const parts = name.split('.');
  
  // Remove generic prefixes like "base", "semantic", "color"
  const filteredParts = parts.filter(part => 
    !['base', 'semantic', 'component'].includes(part.toLowerCase())
  );
  
  // For simple paths, use the last meaningful parts
  const varName = filteredParts.slice(-2).join('-');
  
  return varName;
}

/**
 * Convert a CSS variable name to the full CSS var() reference
 */
export function toCSSVar(name: string): string {
  const cleanName = name.startsWith('--dl-') ? name.substring(5) : name;
  return `var(--dl-${cleanName})`;
}

/**
 * Query a token by path from a design system
 */
export function getTokenByPath(
  nodes: any[],
  path: string
): any | undefined {
  return nodes.find(node => {
    const nodePath = node.name.toLowerCase();
    const searchPath = path.toLowerCase();
    
    // Exact match
    if (nodePath === searchPath) return true;
    
    // Ends with match (for abbreviated paths)
    if (nodePath.endsWith(`.${searchPath}`)) return true;
    
    return false;
  });
}

/**
 * Build a hierarchical token map for easy access
 * Example: { text: { standard: "var(--dl-text-standard)" } }
 */
export function buildTokenMap(nodes: any[]): Record<string, any> {
  const map: Record<string, any> = {};
  
  for (const node of nodes) {
    const parts = node.name.split('.');
    
    // Skip base/semantic prefixes
    const filteredParts = parts.filter(part => 
      !['base', 'semantic', 'component'].includes(part.toLowerCase())
    );
    
    // Build nested structure
    let current = map;
    for (let i = 0; i < filteredParts.length - 1; i++) {
      const part = filteredParts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Add the CSS variable reference
    const lastName = filteredParts[filteredParts.length - 1];
    const cssVarName = nodeNameToCSSVarName(node.name);
    current[lastName] = `var(--dl-${cssVarName})`;
  }
  
  return map;
}

/**
 * Get all tokens of a specific type
 */
export function getTokensByType(
  nodes: any[],
  type: string
): any[] {
  return nodes.filter(node => node.type === type);
}

/**
 * Get all tokens in a specific layer
 */
export function getTokensByLayer(
  nodes: any[],
  layer: string
): any[] {
  return nodes.filter(node => node.layer === layer);
}

