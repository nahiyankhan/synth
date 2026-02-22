/**
 * Graph File System - AI-Native
 * 
 * Organizes tokens and relationships as queryable files.
 * No specialized tools - just grep, cat, jq, find.
 * 
 * Inspired by Vercel's insight:
 * "Well-structured data + file system = tool enough"
 */

import { AIToken, TokenRelationship } from '@/types/aiNativeToken';
import { StyleGraph } from '@/core/StyleGraph';
import { CommandResult } from './virtualFileSystem';

export class GraphFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  constructor(private tokens: Map<string, AIToken>) {
    this.buildGraphStructure();
  }

  /**
   * Build file structure that makes relationships queryable
   */
  private buildGraphStructure(): void {
    this.addTokenFiles();
    this.addRelationshipFiles();
    this.addPrincipleFiles();
    this.addContextFiles();
    this.addConstraintFiles();
    this.addSchemas();
    this.addQueryExamples();
  }

  /**
   * Add token files (by label, not path)
   */
  private addTokenFiles(): void {
    for (const [id, token] of this.tokens) {
      // tokens/brand-blue.json (not base/color/primary!)
      const fileName = this.labelToFileName(token.label);
      const path = `tokens/${fileName}.json`;
      
      this.files.set(path, JSON.stringify(token, null, 2));
      this.directories.add('tokens');
    }

    // Add token index
    const index = Array.from(this.tokens.values()).map(t => ({
      id: t.id,
      label: t.label,
      type: t.type,
      file: `tokens/${this.labelToFileName(t.label)}.json`
    }));
    this.files.set('tokens/INDEX.json', JSON.stringify(index, null, 2));
  }

  /**
   * Add relationship files (queryable by type)
   */
  private addRelationshipFiles(): void {
    // Group relationships by type
    const byType = new Map<string, Array<{
      from: string;
      fromLabel: string;
      to: string;
      toLabel?: string;
      reason?: string;
      strength?: number;
      when?: string[];
      metadata?: any;
    }>>();

    for (const [, token] of this.tokens) {
      for (const rel of token.relationships) {
        if (!byType.has(rel.type)) {
          byType.set(rel.type, []);
        }
        
        const targetToken = this.tokens.get(rel.target);
        byType.get(rel.type)!.push({
          from: token.id,
          fromLabel: token.label,
          to: rel.target,
          toLabel: targetToken?.label,
          reason: rel.reason,
          strength: rel.strength,
          when: rel.when,
          metadata: rel.metadata
        });
      }
    }

    // Write relationship files
    for (const [type, relationships] of byType) {
      const fileName = type.toLowerCase().replace(/_/g, '-');
      const path = `relationships/${fileName}.json`;
      
      this.files.set(path, JSON.stringify({
        type,
        count: relationships.length,
        relationships
      }, null, 2));
      this.directories.add('relationships');
    }

    // Add relationship index
    const index = Array.from(byType.keys()).map(type => ({
      type,
      count: byType.get(type)!.length,
      file: `relationships/${type.toLowerCase().replace(/_/g, '-')}.json`
    }));
    this.files.set('relationships/INDEX.json', JSON.stringify(index, null, 2));
  }

  /**
   * Add per-token relationship files
   */
  private addPerTokenRelationshipFiles(): void {
    for (const [, token] of this.tokens) {
      const fileName = this.labelToFileName(token.label);
      const baseDir = `tokens/${fileName}`;
      
      this.directories.add(baseDir);
      
      // Group by relationship type
      const grouped = new Map<string, TokenRelationship[]>();
      for (const rel of token.relationships) {
        if (!grouped.has(rel.type)) {
          grouped.set(rel.type, []);
        }
        grouped.get(rel.type)!.push(rel);
      }

      // Write per-type relationship files
      for (const [type, rels] of grouped) {
        const relFile = type.toLowerCase().replace(/_/g, '-');
        this.files.set(
          `${baseDir}/${relFile}.json`,
          JSON.stringify(rels, null, 2)
        );
      }
    }
  }

  /**
   * Add brand principle files
   */
  private addPrincipleFiles(): void {
    const principles = new Map<string, {
      id: string;
      name: string;
      tokensExpressing: Array<{
        id: string;
        label: string;
        strength: number;
      }>;
    }>();

    // Find all EXPRESSES relationships
    for (const [, token] of this.tokens) {
      for (const rel of token.relationships) {
        if (rel.type === 'EXPRESSES') {
          if (!principles.has(rel.target)) {
            principles.set(rel.target, {
              id: rel.target,
              name: rel.target.replace('brand-principle-', ''),
              tokensExpressing: []
            });
          }
          
          principles.get(rel.target)!.tokensExpressing.push({
            id: token.id,
            label: token.label,
            strength: rel.strength || 0
          });
        }
      }
    }

    // Write principle files
    for (const [id, principle] of principles) {
      const fileName = principle.name.toLowerCase();
      this.files.set(
        `brand-principles/${fileName}.json`,
        JSON.stringify(principle, null, 2)
      );
      this.directories.add('brand-principles');
    }

    // Add index
    const index = Array.from(principles.values()).map(p => ({
      id: p.id,
      name: p.name,
      tokenCount: p.tokensExpressing.length,
      avgStrength: p.tokensExpressing.reduce((sum, t) => sum + t.strength, 0) / p.tokensExpressing.length,
      file: `brand-principles/${p.name.toLowerCase()}.json`
    }));
    this.files.set('brand-principles/INDEX.json', JSON.stringify(index, null, 2));
  }

  /**
   * Add usage context files
   */
  private addContextFiles(): void {
    const contexts = new Map<string, {
      id: string;
      name: string;
      preferred: string[];
      disallowed: string[];
    }>();

    // Find PREFERRED_FOR and DISALLOWED_IN relationships
    for (const [, token] of this.tokens) {
      for (const rel of token.relationships) {
        if (rel.type === 'PREFERRED_FOR' || rel.type === 'DISALLOWED_IN') {
          if (!contexts.has(rel.target)) {
            contexts.set(rel.target, {
              id: rel.target,
              name: rel.target.replace('context-', ''),
              preferred: [],
              disallowed: []
            });
          }
          
          const context = contexts.get(rel.target)!;
          if (rel.type === 'PREFERRED_FOR') {
            context.preferred.push(token.label);
          } else {
            context.disallowed.push(token.label);
          }
        }
      }
    }

    // Write context files
    for (const [id, context] of contexts) {
      const fileName = context.name.toLowerCase().replace(/_/g, '-');
      this.files.set(
        `contexts/${fileName}.json`,
        JSON.stringify(context, null, 2)
      );
      this.directories.add('contexts');
    }

    // Add index
    const index = Array.from(contexts.values()).map(c => ({
      id: c.id,
      name: c.name,
      preferredCount: c.preferred.length,
      disallowedCount: c.disallowed.length,
      file: `contexts/${c.name.toLowerCase().replace(/_/g, '-')}.json`
    }));
    this.files.set('contexts/INDEX.json', JSON.stringify(index, null, 2));
  }

  /**
   * Add constraint files
   */
  private addConstraintFiles(): void {
    const constraints = new Map<string, {
      id: string;
      name: string;
      passing: string[];
      violating: Array<{
        token: string;
        acknowledged: boolean;
        reason?: string;
      }>;
    }>();

    // Find CONSTRAINS and VIOLATES relationships
    for (const [, token] of this.tokens) {
      for (const rel of token.relationships) {
        if (rel.type === 'CONSTRAINS' || rel.type === 'VIOLATES') {
          if (!constraints.has(rel.target)) {
            constraints.set(rel.target, {
              id: rel.target,
              name: rel.target.replace('constraint-', ''),
              passing: [],
              violating: []
            });
          }
          
          const constraint = constraints.get(rel.target)!;
          if (rel.type === 'CONSTRAINS') {
            constraint.passing.push(token.label);
          } else {
            constraint.violating.push({
              token: token.label,
              acknowledged: rel.acknowledged || false,
              reason: rel.reason
            });
          }
        }
      }
    }

    // Write constraint files
    for (const [id, constraint] of constraints) {
      const fileName = constraint.name.toLowerCase().replace(/_/g, '-');
      this.files.set(
        `constraints/${fileName}.json`,
        JSON.stringify(constraint, null, 2)
      );
      this.directories.add('constraints');
    }

    // Add index
    const index = Array.from(constraints.values()).map(c => ({
      id: c.id,
      name: c.name,
      passingCount: c.passing.length,
      violatingCount: c.violating.length,
      unacknowledgedCount: c.violating.filter(v => !v.acknowledged).length,
      file: `constraints/${c.name.toLowerCase().replace(/_/g, '-')}.json`
    }));
    this.files.set('constraints/INDEX.json', JSON.stringify(index, null, 2));
  }

  /**
   * Add schema files (documentation)
   */
  private addSchemas(): void {
    // Schemas are just documentation now
    const schemaFiles = [
      'relationships.cube.yaml',
      'ai-tokens.cube.yaml',
      'brand-principles.cube.yaml',
      'usage-contexts.cube.yaml',
      'constraints.cube.yaml'
    ];

    // These would be loaded from actual files or embedded
    this.directories.add('schema');
  }

  /**
   * Add query example files
   */
  private addQueryExamples(): void {
    const examples = `# Graph Query Examples

## Find What a Token Expresses

\`\`\`bash
# Find brand principles that Brand Blue expresses
cat tokens/brand-blue.json | jq '.relationships[] | select(.type=="EXPRESSES")'

# Or search relationships directly
cat relationships/expresses.json | jq '.relationships[] | select(.fromLabel=="Brand Blue")'
\`\`\`

## Check Usage Rules

\`\`\`bash
# Can Brand Blue be used in error states?
cat tokens/brand-blue.json | jq '.relationships[] | select(.type=="DISALLOWED_IN" and .to=="context-error-state")'

# What tokens are preferred for primary actions?
cat contexts/primary-action.json | jq '.preferred[]'
\`\`\`

## Find Violations

\`\`\`bash
# Find all unacknowledged violations
find constraints/ -name "*.json" -exec jq -r '.violating[] | select(.acknowledged==false) | .token' {} \\;

# Or search tokens directly
grep -r '"type": "VIOLATES"' tokens/ --include="*.json" | grep '"acknowledged": false'
\`\`\`

## Impact Analysis

\`\`\`bash
# What depends on Brand Blue?
grep -r '"target": "brand-blue"' tokens/ --include="*.json"

# What uses Brand Blue?
cat relationships/used-by.json | jq '.relationships[] | select(.fromLabel=="Brand Blue")'
\`\`\`

## Brand Alignment

\`\`\`bash
# What tokens express trustworthiness?
cat brand-principles/trustworthy.json | jq '.tokensExpressing[]'

# Strong expressions only
cat brand-principles/trustworthy.json | jq '.tokensExpressing[] | select(.strength >= 0.8)'
\`\`\`

## Semantic Search

\`\`\`bash
# Find tokens by brand intent
grep -r '"brandIntent":' tokens/ --include="*.json" | grep -i "trust"

# Find tokens created for specific purpose
grep -r '"createdFor":' tokens/ --include="*.json" | grep -i "accessibility"
\`\`\`
`;

    this.files.set('QUERY_EXAMPLES.md', examples);
  }

  /**
   * Execute file system command
   */
  async execute(command: string): Promise<CommandResult> {
    // Same implementation as VirtualFileSystem
    // but operates on graph-structured files
    
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case 'cat':
          return this.cat(args);
        case 'grep':
          return this.grep(args);
        case 'find':
          return this.find(args);
        case 'ls':
          return this.ls(args);
        case 'tree':
          return this.tree(args);
        case 'jq':
          return this.jq(args);
        default:
          return {
            stdout: '',
            stderr: `Command not supported: ${cmd}`,
            exitCode: 1
          };
      }
    } catch (error: any) {
      return {
        stdout: '',
        stderr: error.message,
        exitCode: 1
      };
    }
  }

  // Helper methods (cat, grep, find, ls, tree, jq)
  // Similar to VirtualFileSystem but optimized for graph queries

  private cat(args: string[]): CommandResult {
    if (args.length === 0) {
      return { stdout: '', stderr: 'Usage: cat <file>', exitCode: 1 };
    }

    const path = args[0].replace(/^\.\//, '');
    const content = this.files.get(path);

    if (!content) {
      return { stdout: '', stderr: `File not found: ${path}`, exitCode: 1 };
    }

    return { stdout: content, exitCode: 0 };
  }

  private grep(args: string[]): CommandResult {
    const flags = args.filter(arg => arg.startsWith('-'));
    const nonFlags = args.filter(arg => !arg.startsWith('-'));

    if (nonFlags.length === 0) {
      return { stdout: '', stderr: 'Usage: grep [-r] [-i] <pattern> [path]', exitCode: 1 };
    }

    const pattern = nonFlags[0];
    const searchPath = nonFlags[1] || '.';
    const recursive = flags.includes('-r') || flags.includes('-R');
    const caseInsensitive = flags.includes('-i');

    const results: string[] = [];
    const regex = new RegExp(pattern, caseInsensitive ? 'gi' : 'g');

    for (const [filePath, content] of this.files) {
      if (!this.matchesPath(filePath, searchPath, recursive)) {
        continue;
      }

      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (regex.test(line)) {
          results.push(`${filePath}:${i + 1}:${line.trim()}`);
        }
      });
    }

    return { stdout: results.join('\n'), exitCode: results.length > 0 ? 0 : 1 };
  }

  private find(args: string[]): CommandResult {
    const searchPath = args[0] || '.';
    const nameIndex = args.indexOf('-name');
    const namePattern = nameIndex !== -1 ? args[nameIndex + 1]?.replace(/['"]/g, '') : null;

    const results: string[] = [];

    for (const filePath of this.files.keys()) {
      if (!filePath.startsWith(searchPath.replace(/^\.\//, ''))) {
        continue;
      }

      if (namePattern) {
        const fileName = filePath.split('/').pop() || '';
        const pattern = namePattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        
        if (!regex.test(fileName)) {
          continue;
        }
      }

      results.push(filePath);
    }

    return { stdout: results.join('\n'), exitCode: 0 };
  }

  private ls(args: string[]): CommandResult {
    const path = (args[0] || '.').replace(/^\.\//, '').replace(/\/$/, '');
    const entries = new Set<string>();

    for (const filePath of this.files.keys()) {
      if (path === '' || filePath.startsWith(path + '/')) {
        const relative = path === '' ? filePath : filePath.slice(path.length + 1);
        const firstPart = relative.split('/')[0];
        
        if (firstPart) {
          entries.add(firstPart);
        }
      }
    }

    return { stdout: Array.from(entries).sort().join('\n'), exitCode: 0 };
  }

  private tree(args: string[]): CommandResult {
    // Simple tree implementation
    return { stdout: 'Tree view', exitCode: 0 };
  }

  private jq(args: string[]): CommandResult {
    // Simple jq simulation for demo
    // In production, you'd use an actual jq library
    const query = args[0];
    const filePath = args[1];

    if (!filePath) {
      return { stdout: '', stderr: 'Usage: jq <query> <file>', exitCode: 1 };
    }

    const content = this.files.get(filePath.replace(/^\.\//, ''));
    if (!content) {
      return { stdout: '', stderr: `File not found: ${filePath}`, exitCode: 1 };
    }

    try {
      const json = JSON.parse(content);
      // Very basic jq simulation - just return formatted JSON
      return { stdout: JSON.stringify(json, null, 2), exitCode: 0 };
    } catch (e) {
      return { stdout: '', stderr: `Invalid JSON: ${filePath}`, exitCode: 1 };
    }
  }

  private matchesPath(filePath: string, searchPath: string, recursive: boolean): boolean {
    const normalizedSearch = searchPath.replace(/^\.\//, '').replace(/\/$/, '');
    
    if (normalizedSearch === '' || normalizedSearch === '.') return true;
    if (!filePath.startsWith(normalizedSearch)) return false;
    
    if (!recursive) {
      const relative = filePath.slice(normalizedSearch.length).replace(/^\//, '');
      return !relative.includes('/');
    }

    return true;
  }

  private labelToFileName(label: string): string {
    return label.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  getFilePaths(): string[] {
    return Array.from(this.files.keys());
  }

  getFile(path: string): string | undefined {
    return this.files.get(path.replace(/^\.\//, ''));
  }
}

