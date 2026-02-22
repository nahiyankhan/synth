/**
 * Design Language Token Generator
 * 
 * Generates CSS custom properties from any design system JSON.
 * Works with design systems that have a nodes structure with { name, type, value: { light, dark } }
 */

interface DesignSystemNode {
  id: string;
  name: string;
  layer: string;
  type: string;
  value: {
    light?: string;
    dark?: string;
  };
  dependencies?: string[];
  dependents?: string[];
  metadata?: any;
}

interface DesignSystem {
  metadata?: any;
  nodes: DesignSystemNode[];
}

/**
 * Convert a hex color to HSL format for CSS custom properties
 */
function hexToHSL(hex: string): string {
  // Handle transparent/clear colors
  if (hex.length === 9 && hex.endsWith('00')) {
    return '0 0% 0% / 0';
  }
  
  // Remove # and handle alpha
  const cleanHex = hex.replace('#', '');
  const hasAlpha = cleanHex.length === 8;
  
  let r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  let g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  let b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  let a = hasAlpha ? parseInt(cleanHex.substring(6, 8), 16) / 255 : 1;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  if (a < 1) {
    return `${h} ${s}% ${lPercent}% / ${a.toFixed(2)}`;
  }
  
  return `${h} ${s}% ${lPercent}%`;
}

/**
 * Convert a design system node name to a CSS variable name
 * Example: "base.color.constant.black" -> "--dl-black"
 * Example: "semantic.color.text.standard" -> "--dl-text-standard"
 */
function nodeNameToCSSVar(name: string): string {
  const parts = name.split('.');
  
  // Remove generic prefixes like "base", "semantic", "color"
  const filteredParts = parts.filter(part => 
    !['base', 'semantic', 'component'].includes(part.toLowerCase())
  );
  
  // For simple paths, use the last meaningful parts
  const varName = filteredParts.slice(-2).join('-');
  
  return `--dl-${varName}`;
}

/**
 * Generate CSS custom properties from a design system JSON
 */
export function generateCSSFromDesignSystem(designSystem: DesignSystem): string {
  const lightVars: string[] = [];
  const darkVars: string[] = [];
  
  // Process each node
  for (const node of designSystem.nodes) {
    const cssVarName = nodeNameToCSSVar(node.name);
    
    // Handle color tokens
    if (node.type === 'color' && node.value) {
      if (node.value.light) {
        const hslValue = hexToHSL(node.value.light);
        lightVars.push(`    ${cssVarName}: ${hslValue};`);
      }
      
      if (node.value.dark && node.value.dark !== node.value.light) {
        const hslValue = hexToHSL(node.value.dark);
        darkVars.push(`    ${cssVarName}: ${hslValue};`);
      }
    }
    
    // Handle typography tokens (font-size, line-height, etc.)
    if (node.type === 'typography' && node.value) {
      if (node.value.light) {
        lightVars.push(`    ${cssVarName}: ${node.value.light};`);
      }
    }
    
    // Handle spacing tokens
    if (node.type === 'spacing' && node.value) {
      if (node.value.light) {
        lightVars.push(`    ${cssVarName}: ${node.value.light};`);
      }
    }
  }
  
  // Generate CSS
  let css = `/**
 * Design Language Tokens
 * Auto-generated from design system JSON
 * Do not edit manually - regenerate using designLanguageTokenGenerator
 */

@layer base {
  :root {
    /* Design Language Tokens - Light Mode */
${lightVars.join('\n')}
  }

  .dark {
    /* Design Language Tokens - Dark Mode Overrides */
${darkVars.join('\n')}
  }
}
`;
  
  return css;
}

/**
 * Generate CSS file from a design system JSON file
 */
export async function generateCSSFile(
  designSystemPath: string,
  outputPath: string
): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  // Read design system JSON
  const jsonContent = await fs.readFile(designSystemPath, 'utf-8');
  const designSystem: DesignSystem = JSON.parse(jsonContent);
  
  // Generate CSS
  const css = generateCSSFromDesignSystem(designSystem);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  
  // Write CSS file
  await fs.writeFile(outputPath, css, 'utf-8');
  
  console.log(`✓ Generated ${outputPath}`);
  console.log(`  Processed ${designSystem.nodes.length} tokens`);
}

