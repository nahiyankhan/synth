/**
 * Virtual File System for Design System
 *
 * Creates an in-memory file system representation of the design system
 * that can be queried with file system commands (grep, cat, find, etc.)
 * AND modified with write commands (echo, rm, mkdir).
 *
 * Inspired by Vercel's file-system agent approach:
 * https://vercel.com/blog/how-to-build-agents-with-filesystems-and-bash
 */

import { StyleGraph } from '../core/StyleGraph';
import { StyleNode, StyleChange } from '../types/styleGraph';

export interface CommandResult {
  stdout: string;
  stderr?: string;
  exitCode: number;
}

export interface BrandContext {
  strategy?: {
    analysis?: {
      industry?: string;
      audience?: string;
      keyInsights?: string[];
      productContext?: string;
      interfaceComplexity?: string;
    };
    recommendation?: {
      direction?: string;
      reasoning?: string;
      coreMessage?: string;
      systemStrategy?: string;
    };
  };
  identity?: {
    traits?: string[];
    voiceTone?: string;
    visualReferences?: string[];
    designPrinciples?: string[];
    emotionalResonance?: string[];
    aestheticPreferences?: string[];
  };
}

export interface WriteCallbacks {
  onWriteToken?: (path: string, data: Partial<StyleNode>) => StyleChange;
  onDeleteToken?: (nodeId: string, force: boolean) => { success: boolean; message: string };
}

export class VirtualFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();
  private initialized = false;

  constructor(
    private graph: StyleGraph,
    private schemaFiles?: Map<string, string>,
    private brandContext?: BrandContext,
    private writeCallbacks?: WriteCallbacks
  ) {
    // Synchronous initialization only
    this.buildFileStructureSync();
  }

  /**
   * Build the virtual file structure from the graph (sync)
   */
  private buildFileStructureSync(): void {
    // Add schemas if provided
    this.addSchemaFilesSync();

    // Add tokens organized by path
    this.addTokenFiles();

    // Add metadata files
    this.addMetadataFiles();

    // Add brand context files (P1)
    this.addBrandContextFiles();

    // Add export format files (P2)
    this.addExportFiles();

    // Add documentation
    this.addDocumentationFiles();

    this.initialized = true;
  }

  /**
   * Add schema files (sync - from provided map only)
   */
  private addSchemaFilesSync(): void {
    if (this.schemaFiles) {
      // Use provided schema files
      for (const [file, content] of this.schemaFiles) {
        this.files.set(`schema/${file}`, content);
      }
      this.directories.add('schema');
    } else {
      // Add placeholder README
      const readme = `# Schemas

Schema files would be loaded here.
Use VirtualFileSystem.loadSchemas() to load from server.`;
      this.files.set('schema/README.md', readme);
      this.directories.add('schema');
    }
  }

  /**
   * Load schema files asynchronously (for browser environment)
   */
  async loadSchemas(): Promise<void> {
    if (this.schemaFiles) {
      // Already loaded from constructor
      return;
    }

    const schemaFiles = [
      'tokens.cube.yaml',
      'colors.cube.yaml',
      'typography.cube.yaml',
      'dependencies.cube.yaml',
      'README.md'
    ];

    for (const file of schemaFiles) {
      try {
        const response = await fetch(`/schema/${file}`);
        if (response.ok) {
          const content = await response.text();
          this.files.set(`schema/${file}`, content);
          this.directories.add('schema');
        }
      } catch (error) {
        // Schema file not found, skip
        console.warn(`Schema file not found: ${file}`);
      }
    }
  }

  /**
   * Add token files organized by path structure
   */
  private addTokenFiles(): void {
    for (const [id, node] of this.graph.nodes) {
      // Skip nodes without names
      if (!node.name) {
        console.warn(`Skipping node ${id} - no name defined`);
        continue;
      }

      // Create file path from token name
      // e.g., "base.color.primary" -> "tokens/base/color/primary.json"
      const path = this.nodeToPath(node);
      const content = JSON.stringify(this.nodeToJSON(node), null, 2);

      this.files.set(path, content);

      // Add directories
      const dirs = path.split('/');
      for (let i = 1; i < dirs.length; i++) {
        const dir = dirs.slice(0, i).join('/');
        this.directories.add(dir);
      }
    }
  }

  /**
   * Add metadata files
   */
  private addMetadataFiles(): void {
    // Overall stats
    const stats = this.graph.getStats();
    this.files.set('metadata/stats.json', JSON.stringify(stats, null, 2));

    // Dependency graph summary
    const dependencies = this.buildDependencyGraph();
    this.files.set('metadata/dependencies.json', JSON.stringify(dependencies, null, 2));

    // Layer distribution
    const layerDistribution = this.getLayerDistribution();
    this.files.set('metadata/layers.json', JSON.stringify(layerDistribution, null, 2));

    // Type distribution
    const typeDistribution = this.getTypeDistribution();
    this.files.set('metadata/types.json', JSON.stringify(typeDistribution, null, 2));

    this.directories.add('metadata');
  }

  /**
   * Add documentation files
   */
  private addDocumentationFiles(): void {
    const readme = `# Design System Files

This virtual file system represents the design system structure.
It supports both **read** and **write** operations.

## Directory Structure

\`\`\`
/
├── schema/           # Cube.js-style semantic layer schemas
│   ├── tokens.cube.yaml
│   ├── colors.cube.yaml
│   ├── typography.cube.yaml
│   └── dependencies.cube.yaml
├── tokens/           # Individual token files (READ/WRITE)
│   ├── base/
│   │   ├── color/
│   │   ├── typography/
│   │   └── spacing/
│   ├── semantic/
│   └── composite/
├── brand/            # Brand context from generation
│   ├── strategy.json
│   ├── identity.json
│   ├── summary.md
│   └── guidelines/
│       ├── principles.md
│       └── voice-tone.md
├── exports/          # Auto-generated export formats
│   ├── css/tokens.css
│   ├── json/tokens.json
│   └── scss/_variables.scss
├── metadata/         # System metadata
│   ├── stats.json
│   ├── dependencies.json
│   ├── layers.json
│   └── types.json
└── README.md         # This file
\`\`\`

## Read Commands

### Explore tokens
\`\`\`bash
# List all tokens
ls tokens/

# View a specific token
cat tokens/base/color/primary.json

# Search for tokens
grep -r "primary" tokens/
find tokens/ -name "*error*"
\`\`\`

### Analyze brand context
\`\`\`bash
# View brand summary
cat brand/summary.md

# Search design principles
grep -r "accessible" brand/

# View strategy
cat brand/strategy.json
\`\`\`

### Export formats
\`\`\`bash
# Get CSS custom properties
cat exports/css/tokens.css

# Get DTCG format JSON
cat exports/json/tokens.json

# Get SCSS variables
cat exports/scss/_variables.scss
\`\`\`

### System metadata
\`\`\`bash
# View statistics
cat metadata/stats.json

# Check layer distribution
cat metadata/layers.json

# Analyze dependencies
cat metadata/dependencies.json
\`\`\`

## Write Commands

Write operations are **only permitted in the tokens/ directory** for safety.

### Create/update tokens
\`\`\`bash
# Create a new token
echo '{"id":"brand-blue","name":"brand.blue","type":"color","value":"#0066CC"}' > tokens/brand/blue.json

# Update an existing token
echo '{"value":"#0055BB"}' > tokens/brand/blue.json
\`\`\`

### Delete tokens
\`\`\`bash
# Delete a token (will warn if has dependents)
rm tokens/brand/old-color.json

# Force delete (ignores dependents)
rm -f tokens/brand/old-color.json
\`\`\`

### Create directories
\`\`\`bash
# Create a new token group
mkdir -p tokens/semantic/brand
\`\`\`

## Supported Commands

| Command | Description | Example |
|---------|-------------|---------|
| \`cat\` | Read file contents | \`cat tokens/base/color/primary.json\` |
| \`grep\` | Search file contents | \`grep -r "blue" tokens/\` |
| \`find\` | Find files by pattern | \`find tokens/ -name "*.json"\` |
| \`ls\` | List directory | \`ls -l tokens/base/\` |
| \`tree\` | Show directory tree | \`tree -L 2 tokens/\` |
| \`wc\` | Count lines/words | \`wc tokens/base/color/primary.json\` |
| \`echo\` | Create/write file | \`echo '{"value":"#F00"}' > tokens/test.json\` |
| \`rm\` | Delete file | \`rm tokens/old.json\` |
| \`mkdir\` | Create directory | \`mkdir -p tokens/new/group\` |
`;

    this.files.set('README.md', readme);

    // Add MIGRATION.md for tool deprecation guidance
    const migration = `# Tool Migration Guide

Many specialized tools can be replaced with filesystem commands.

## Query Operations

| Old Tool | New Command |
|----------|-------------|
| \`getToken({ path: 'base.color.primary' })\` | \`cat tokens/base/color/primary.json\` |
| \`searchTokens({ query: 'blue' })\` | \`grep -r "blue" tokens/\` |
| \`searchTokens({ layer: 'semantic' })\` | \`ls tokens/semantic/\` |
| \`getSystemStats()\` | \`cat metadata/stats.json\` |
| \`findAllReferences(nodeId)\` | \`grep -r "nodeId" metadata/dependencies.json\` |

## Export Operations

| Old Tool | New Command |
|----------|-------------|
| \`exportDesignSystem({ format: 'json' })\` | \`cat exports/json/tokens.json\` |
| \`exportDesignSystem({ format: 'css' })\` | \`cat exports/css/tokens.css\` |

## Modify Operations

| Old Tool | New Command |
|----------|-------------|
| \`createToken(...)\` | \`echo '{"id":..., "value":...}' > tokens/path.json\` |
| \`deleteToken({ path })\` | \`rm tokens/path.json\` |

## Operations to Keep Using Tools

These operations require complex logic that cannot be expressed as file commands:

- \`analyzeDesignSystem\` - Complex analytics with narrative generation
- \`getImpactAnalysis\` - Transitive dependency calculation
- \`generateColorScale\` - OKLCH color science computations
- \`suggestColorsForGaps\` - Color palette gap detection
- \`undoChange\` / \`redoChange\` - History stack management
`;

    this.files.set('MIGRATION.md', migration);
  }

  /**
   * Execute a file system command
   */
  async execute(command: string): Promise<CommandResult> {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      switch (cmd) {
        // Read commands
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
        case 'wc':
          return this.wc(args);
        // JSON query command
        case 'jq':
          return this.jq(args);
        // Write commands
        case 'echo':
          return this.echo(args);
        case 'rm':
          return this.rm(args);
        case 'mkdir':
          return this.mkdir(args);
        default:
          return {
            stdout: '',
            stderr: `Command not supported: ${cmd}. Supported: cat, grep, find, ls, tree, wc, jq, echo, rm, mkdir`,
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

  /**
   * Cat command: Read file contents
   */
  private cat(args: string[]): CommandResult {
    if (args.length === 0) {
      return { stdout: '', stderr: 'Usage: cat <file>', exitCode: 1 };
    }

    const path = this.normalizePath(args[0]);
    const content = this.files.get(path);

    if (!content) {
      return { stdout: '', stderr: `File not found: ${path}`, exitCode: 1 };
    }

    return { stdout: content, exitCode: 0 };
  }

  /**
   * Grep command: Search for patterns
   */
  private grep(args: string[]): CommandResult {
    // Parse grep flags
    const flags = args.filter(arg => arg.startsWith('-'));
    const nonFlags = args.filter(arg => !arg.startsWith('-'));

    if (nonFlags.length === 0) {
      return { stdout: '', stderr: 'Usage: grep [-r] [-i] <pattern> [path]', exitCode: 1 };
    }

    // Strip surrounding quotes from pattern if present
    let pattern = nonFlags[0];
    if ((pattern.startsWith("'") && pattern.endsWith("'")) ||
        (pattern.startsWith('"') && pattern.endsWith('"'))) {
      pattern = pattern.slice(1, -1);
    }
    const searchPath = nonFlags[1] || '.';
    const recursive = flags.includes('-r') || flags.includes('-R');
    const caseInsensitive = flags.includes('-i');

    const results: string[] = [];
    const regex = new RegExp(pattern, caseInsensitive ? 'gi' : 'g');

    for (const [filePath, content] of this.files) {
      // Check if file matches search path
      if (!this.matchesPath(filePath, searchPath, recursive)) {
        continue;
      }

      // Search content
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (regex.test(line)) {
          results.push(`${filePath}:${i + 1}:${line.trim()}`);
        }
      });
    }

    return { stdout: results.join('\n'), exitCode: results.length > 0 ? 0 : 1 };
  }

  /**
   * Find command: Find files by name pattern
   */
  private find(args: string[]): CommandResult {
    // Parse arguments - path is the first non-flag argument
    const flags = args.filter(arg => arg.startsWith('-'));
    const nonFlags = args.filter(arg => !arg.startsWith('-') && !args.some((a, i) => a.startsWith('-') && args[i + 1] === arg && !arg.startsWith('-')));

    // Get path (first positional arg that's not a flag value)
    let searchPath = '.';
    let argIndex = 0;
    while (argIndex < args.length) {
      const arg = args[argIndex];
      if (arg.startsWith('-')) {
        // Skip flag and its value if it has one
        if (arg === '-name' || arg === '-type' || arg === '-path') {
          argIndex += 2;
        } else {
          argIndex++;
        }
      } else {
        searchPath = arg;
        break;
      }
    }

    const nameIndex = args.indexOf('-name');
    const namePattern = nameIndex !== -1 ? args[nameIndex + 1]?.replace(/['"]/g, '') : null;

    const pathIndex = args.indexOf('-path');
    const pathPattern = pathIndex !== -1 ? args[pathIndex + 1]?.replace(/['"]/g, '') : null;

    const results: string[] = [];
    const normalizedSearchPath = this.normalizePath(searchPath);

    for (const filePath of this.files.keys()) {
      // Check if file is under search path
      if (normalizedSearchPath && !filePath.startsWith(normalizedSearchPath)) {
        continue;
      }

      // Check -name pattern (matches filename only)
      if (namePattern) {
        const fileName = filePath.split('/').pop() || '';
        const pattern = namePattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);

        if (!regex.test(fileName)) {
          continue;
        }
      }

      // Check -path pattern (matches full path)
      if (pathPattern) {
        const pattern = pathPattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);

        if (!regex.test(filePath)) {
          continue;
        }
      }

      results.push(filePath);
    }

    return { stdout: results.join('\n'), exitCode: 0 };
  }

  /**
   * Ls command: List directory contents
   */
  private ls(args: string[]): CommandResult {
    const path = this.normalizePath(args[0] || '.');
    const showAll = args.includes('-a');
    const longFormat = args.includes('-l');

    const entries = new Set<string>();

    // Find immediate children
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(path)) {
        const relative = filePath.slice(path.length).replace(/^\//, '');
        const firstPart = relative.split('/')[0];
        
        if (firstPart && (showAll || !firstPart.startsWith('.'))) {
          entries.add(firstPart);
        }
      }
    }

    // Add subdirectories
    for (const dir of this.directories) {
      if (dir.startsWith(path)) {
        const relative = dir.slice(path.length).replace(/^\//, '');
        const firstPart = relative.split('/')[0];
        
        if (firstPart && (showAll || !firstPart.startsWith('.'))) {
          entries.add(firstPart + '/');
        }
      }
    }

    const sorted = Array.from(entries).sort();
    
    if (longFormat) {
      // Simple long format
      return {
        stdout: sorted.map(entry => {
          const isDir = entry.endsWith('/');
          const type = isDir ? 'd' : '-';
          return `${type}rw-r--r--  1 user  group  0 Jan  1 00:00 ${entry}`;
        }).join('\n'),
        exitCode: 0
      };
    }

    return { stdout: sorted.join('\n'), exitCode: 0 };
  }

  /**
   * Tree command: Show directory tree
   */
  private tree(args: string[]): CommandResult {
    // Parse arguments - find path and -L flag properly
    let maxDepth = Infinity;
    let path = '.';

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      if (arg === '-L' && i + 1 < args.length) {
        maxDepth = parseInt(args[i + 1]) || Infinity;
        i += 2;
      } else if (arg.startsWith('-')) {
        i++;
      } else {
        // First non-flag argument is the path
        path = arg;
        i++;
      }
    }

    const normalizedPath = this.normalizePath(path);
    const tree = this.buildTree(normalizedPath, maxDepth);
    return { stdout: tree, exitCode: 0 };
  }

  /**
   * Wc command: Count lines, words, characters
   */
  private wc(args: string[]): CommandResult {
    if (args.length === 0) {
      return { stdout: '', stderr: 'Usage: wc <file>', exitCode: 1 };
    }

    const path = this.normalizePath(args[0]);
    const content = this.files.get(path);

    if (!content) {
      return { stdout: '', stderr: `File not found: ${path}`, exitCode: 1 };
    }

    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;

    return { stdout: `${lines} ${words} ${chars} ${path}`, exitCode: 0 };
  }

  /**
   * Jq command: Query JSON files
   * Supports basic jq expressions: .key, .key.nested, .key[], .[0], keys, type, length
   * Usage: jq '<expression>' <file>
   *
   * Examples:
   *   jq '.value' tokens/base/color/primary.json
   *   jq '.metadata.purpose' tokens/semantic/text/standard.json
   *   jq '.dependencies[]' tokens/utility/bg/app.json
   *   jq 'keys' tokens/base/color/primary.json
   */
  private jq(args: string[]): CommandResult {
    if (args.length < 2) {
      return {
        stdout: '',
        stderr: 'Usage: jq <expression> <file>\nExamples:\n  jq \'.value\' tokens/base/color/primary.json\n  jq \'.metadata.purpose\' tokens/file.json\n  jq \'keys\' tokens/file.json',
        exitCode: 1
      };
    }

    // Parse expression (may be quoted)
    let expression = args[0];
    if ((expression.startsWith("'") && expression.endsWith("'")) ||
        (expression.startsWith('"') && expression.endsWith('"'))) {
      expression = expression.slice(1, -1);
    }

    const filePath = this.normalizePath(args[1]);
    const content = this.files.get(filePath);

    if (!content) {
      return { stdout: '', stderr: `File not found: ${filePath}`, exitCode: 1 };
    }

    try {
      const json = JSON.parse(content);
      const result = this.evaluateJqExpression(expression, json);

      // Format output
      if (result === null) {
        return { stdout: 'null', exitCode: 0 };
      } else if (result === undefined) {
        return { stdout: '', stderr: `Expression returned undefined: ${expression}`, exitCode: 1 };
      } else if (typeof result === 'string') {
        return { stdout: result, exitCode: 0 };
      } else if (typeof result === 'number' || typeof result === 'boolean') {
        return { stdout: String(result), exitCode: 0 };
      } else {
        return { stdout: JSON.stringify(result, null, 2), exitCode: 0 };
      }
    } catch (error: any) {
      return {
        stdout: '',
        stderr: `jq error: ${error.message}`,
        exitCode: 1
      };
    }
  }

  /**
   * Evaluate a basic jq expression on a JSON object
   * Supports: .key, .key.nested, .key[], .[0], keys, type, length, .
   */
  private evaluateJqExpression(expression: string, json: any): any {
    // Handle identity
    if (expression === '.') {
      return json;
    }

    // Handle 'keys' function
    if (expression === 'keys') {
      if (typeof json === 'object' && json !== null) {
        return Object.keys(json);
      }
      throw new Error('keys requires an object');
    }

    // Handle 'type' function
    if (expression === 'type') {
      if (json === null) return 'null';
      if (Array.isArray(json)) return 'array';
      return typeof json;
    }

    // Handle 'length' function
    if (expression === 'length') {
      if (typeof json === 'string') return json.length;
      if (Array.isArray(json)) return json.length;
      if (typeof json === 'object' && json !== null) return Object.keys(json).length;
      throw new Error('length requires a string, array, or object');
    }

    // Handle dot notation: .key, .key.nested, .key[]
    if (expression.startsWith('.')) {
      const path = expression.slice(1); // Remove leading dot
      return this.navigateJsonPath(json, path);
    }

    throw new Error(`Unsupported jq expression: ${expression}`);
  }

  /**
   * Navigate a JSON path like "key.nested", "key[]", "key[0]"
   */
  private navigateJsonPath(json: any, path: string): any {
    if (!path) return json;

    let current = json;
    const parts = this.splitJsonPath(path);

    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }

      // Handle array iteration: []
      if (part === '[]') {
        if (!Array.isArray(current)) {
          throw new Error(`Cannot iterate over non-array with []`);
        }
        return current;
      }

      // Handle array index: [0], [1], etc.
      const indexMatch = part.match(/^\[(\d+)\]$/);
      if (indexMatch) {
        const index = parseInt(indexMatch[1]);
        if (!Array.isArray(current)) {
          throw new Error(`Cannot index non-array with [${index}]`);
        }
        current = current[index];
        continue;
      }

      // Handle object key
      if (typeof current !== 'object') {
        throw new Error(`Cannot access property '${part}' on non-object`);
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Split a JSON path into parts, handling keys and array operators
   * Examples:
   *   "key.nested" -> ["key", "nested"]
   *   "key[]" -> ["key", "[]"]
   *   "key[0]" -> ["key", "[0]"]
   *   "key[0].value" -> ["key", "[0]", "value"]
   */
  private splitJsonPath(path: string): string[] {
    const parts: string[] = [];
    let current = '';
    let i = 0;

    while (i < path.length) {
      const char = path[i];

      if (char === '.') {
        if (current) {
          parts.push(current);
          current = '';
        }
        i++;
      } else if (char === '[') {
        if (current) {
          parts.push(current);
          current = '';
        }
        // Find closing bracket
        const closeIndex = path.indexOf(']', i);
        if (closeIndex === -1) {
          throw new Error('Unclosed bracket in path');
        }
        parts.push(path.slice(i, closeIndex + 1));
        i = closeIndex + 1;
      } else {
        current += char;
        i++;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  // ============================================
  // WRITE COMMANDS
  // ============================================

  /**
   * Echo command: Create/update token files
   * Usage: echo '<json>' > tokens/layer/type/name.json
   */
  private echo(args: string[]): CommandResult {
    // Find redirect operator
    const redirectIndex = args.findIndex(a => a === '>' || a === '>>');

    // If no redirect, just echo the text (standard echo behavior)
    if (redirectIndex === -1) {
      return { stdout: args.join(' '), exitCode: 0 };
    }

    const append = args[redirectIndex] === '>>';
    const contentParts = args.slice(0, redirectIndex);
    const targetPath = this.normalizePath(args[redirectIndex + 1] || '');

    if (!targetPath) {
      return { stdout: '', stderr: 'Usage: echo <content> > <path>', exitCode: 1 };
    }

    // Only allow writes to tokens/ directory for safety
    if (!targetPath.startsWith('tokens/')) {
      return {
        stdout: '',
        stderr: 'Write operations only permitted in tokens/ directory',
        exitCode: 1
      };
    }

    // Parse content - handle quoted strings
    let content = contentParts.join(' ');
    // Remove surrounding quotes if present
    if ((content.startsWith("'") && content.endsWith("'")) ||
        (content.startsWith('"') && content.endsWith('"'))) {
      content = content.slice(1, -1);
    }

    // Attempt to parse as JSON for token creation
    let tokenData: any;
    try {
      tokenData = JSON.parse(content);
    } catch {
      return {
        stdout: '',
        stderr: 'Content must be valid JSON for token files',
        exitCode: 1
      };
    }

    // Use write callback if available
    if (this.writeCallbacks?.onWriteToken) {
      try {
        const change = this.writeCallbacks.onWriteToken(targetPath, tokenData);
        this.refresh(); // Rebuild file structure
        return {
          stdout: `Created ${targetPath} (version ${change.version})`,
          exitCode: 0
        };
      } catch (error: any) {
        return { stdout: '', stderr: error.message, exitCode: 1 };
      }
    }

    // Fallback: just update the in-memory file (no persistence)
    if (append && this.files.has(targetPath)) {
      const existing = this.files.get(targetPath) || '';
      this.files.set(targetPath, existing + '\n' + content);
    } else {
      this.files.set(targetPath, content);
    }

    // Add parent directories
    this.addDirectoriesForPath(targetPath);

    return { stdout: `Created ${targetPath} (in-memory only)`, exitCode: 0 };
  }

  /**
   * Rm command: Delete token files
   * Usage: rm [-f] tokens/layer/type/name.json
   */
  private rm(args: string[]): CommandResult {
    const force = args.includes('-f');
    const paths = args.filter(a => !a.startsWith('-'));

    if (paths.length === 0) {
      return { stdout: '', stderr: 'Usage: rm [-f] <path>', exitCode: 1 };
    }

    const targetPath = this.normalizePath(paths[0]);

    // Only allow deletes in tokens/ directory for safety
    if (!targetPath.startsWith('tokens/')) {
      return {
        stdout: '',
        stderr: 'Delete operations only permitted in tokens/ directory',
        exitCode: 1
      };
    }

    // Check if file exists
    if (!this.files.has(targetPath)) {
      if (force) {
        return { stdout: '', exitCode: 0 }; // -f ignores missing files
      }
      return { stdout: '', stderr: `File not found: ${targetPath}`, exitCode: 1 };
    }

    // Extract node ID from path
    const nodeId = this.pathToNodeId(targetPath);
    if (!nodeId) {
      return { stdout: '', stderr: `Cannot determine token ID from path: ${targetPath}`, exitCode: 1 };
    }

    // Check for dependents unless force flag
    if (!force) {
      const node = this.graph.nodes.get(nodeId);
      if (node && node.dependents.size > 0) {
        const dependentList = Array.from(node.dependents).slice(0, 3).join(', ');
        const more = node.dependents.size > 3 ? ` and ${node.dependents.size - 3} more` : '';
        return {
          stdout: '',
          stderr: `Token has ${node.dependents.size} dependent(s): ${dependentList}${more}. Use -f to force delete.`,
          exitCode: 1
        };
      }
    }

    // Use delete callback if available
    if (this.writeCallbacks?.onDeleteToken) {
      const result = this.writeCallbacks.onDeleteToken(nodeId, force);
      if (!result.success) {
        return { stdout: '', stderr: result.message, exitCode: 1 };
      }
      this.refresh(); // Rebuild file structure
      return { stdout: `Deleted ${targetPath}`, exitCode: 0 };
    }

    // Fallback: just remove from in-memory files
    this.files.delete(targetPath);
    return { stdout: `Deleted ${targetPath} (in-memory only)`, exitCode: 0 };
  }

  /**
   * Mkdir command: Create directories
   * Usage: mkdir [-p] tokens/layer/type
   */
  private mkdir(args: string[]): CommandResult {
    const createParents = args.includes('-p');
    const paths = args.filter(a => !a.startsWith('-'));

    if (paths.length === 0) {
      return { stdout: '', stderr: 'Usage: mkdir [-p] <path>', exitCode: 1 };
    }

    const targetPath = this.normalizePath(paths[0]);

    // Only allow directory creation under tokens/ for safety
    if (!targetPath.startsWith('tokens/') && targetPath !== 'tokens') {
      return {
        stdout: '',
        stderr: 'Directory creation only permitted under tokens/',
        exitCode: 1
      };
    }

    if (this.directories.has(targetPath)) {
      if (createParents) {
        return { stdout: '', exitCode: 0 }; // -p ignores existing dirs
      }
      return { stdout: '', stderr: `Directory exists: ${targetPath}`, exitCode: 1 };
    }

    if (createParents) {
      this.addDirectoriesForPath(targetPath + '/placeholder');
    } else {
      // Check parent exists
      const parent = targetPath.split('/').slice(0, -1).join('/');
      if (parent && !this.directories.has(parent)) {
        return { stdout: '', stderr: `Parent directory does not exist: ${parent}`, exitCode: 1 };
      }
      this.directories.add(targetPath);
    }

    return { stdout: `Created directory ${targetPath}`, exitCode: 0 };
  }

  // ============================================
  // PATH-NODE MAPPING HELPERS
  // ============================================

  /**
   * Convert a file path to a node ID
   * tokens/base/color/primary.json -> base.color.primary
   */
  pathToNodeId(path: string): string | null {
    const normalized = this.normalizePath(path);

    // Must be in tokens/ directory and be a .json file
    if (!normalized.startsWith('tokens/') || !normalized.endsWith('.json')) {
      return null;
    }

    // Remove tokens/ prefix and .json suffix
    const tokenPath = normalized.slice('tokens/'.length, -'.json'.length);

    // Convert path separators to dots
    return tokenPath.replace(/\//g, '.');
  }

  /**
   * Convert a node ID to a file path
   * base.color.primary -> tokens/base/color/primary.json
   */
  nodeIdToPath(nodeId: string): string {
    return `tokens/${nodeId.replace(/\./g, '/')}.json`;
  }

  /**
   * Add all parent directories for a given path
   */
  private addDirectoriesForPath(path: string): void {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      const dir = parts.slice(0, i).join('/');
      this.directories.add(dir);
    }
  }

  // ============================================
  // BRAND CONTEXT FILES (P1)
  // ============================================

  /**
   * Add brand context files from generation metadata
   */
  private addBrandContextFiles(): void {
    if (!this.brandContext) return;

    const { strategy, identity } = this.brandContext;

    // Create brand directory
    this.directories.add('brand');
    this.directories.add('brand/guidelines');

    // strategy.json
    if (strategy) {
      this.files.set('brand/strategy.json', JSON.stringify(strategy, null, 2));
    }

    // identity.json
    if (identity) {
      this.files.set('brand/identity.json', JSON.stringify(identity, null, 2));
    }

    // summary.md - Human-readable brand summary
    const summary = this.generateBrandSummary();
    if (summary) {
      this.files.set('brand/summary.md', summary);
    }

    // guidelines/principles.md
    if (identity?.designPrinciples && identity.designPrinciples.length > 0) {
      const principles = `# Design Principles\n\n${identity.designPrinciples
        .map((p, i) => `${i + 1}. **${p}**`)
        .join('\n\n')}`;
      this.files.set('brand/guidelines/principles.md', principles);
    }

    // guidelines/voice-tone.md
    if (identity?.voiceTone || identity?.traits) {
      const voiceTone = `# Voice & Tone\n\n${identity.voiceTone || ''}\n\n## Brand Traits\n\n${
        (identity.traits || []).map(t => `- ${t}`).join('\n')
      }`;
      this.files.set('brand/guidelines/voice-tone.md', voiceTone);
    }
  }

  /**
   * Generate human-readable brand summary
   */
  private generateBrandSummary(): string | null {
    if (!this.brandContext?.strategy && !this.brandContext?.identity) {
      return null;
    }

    const { strategy, identity } = this.brandContext;
    const sections: string[] = ['# Brand Summary\n'];

    if (strategy?.analysis) {
      sections.push('## Strategic Foundation\n');
      if (strategy.analysis.industry) {
        sections.push(`**Industry**: ${strategy.analysis.industry}`);
      }
      if (strategy.analysis.audience) {
        sections.push(`**Audience**: ${strategy.analysis.audience}`);
      }
      if (strategy.analysis.productContext) {
        sections.push(`**Product Context**: ${strategy.analysis.productContext}`);
      }
      if (strategy.analysis.keyInsights && strategy.analysis.keyInsights.length > 0) {
        sections.push('\n### Key Insights\n');
        sections.push(strategy.analysis.keyInsights.map(i => `- ${i}`).join('\n'));
      }
    }

    if (strategy?.recommendation) {
      sections.push('\n## Brand Direction\n');
      if (strategy.recommendation.direction) {
        sections.push(`**Direction**: ${strategy.recommendation.direction}`);
      }
      if (strategy.recommendation.coreMessage) {
        sections.push(`**Core Message**: ${strategy.recommendation.coreMessage}`);
      }
      if (strategy.recommendation.reasoning) {
        sections.push(`\n### Reasoning\n\n${strategy.recommendation.reasoning}`);
      }
    }

    if (identity) {
      sections.push('\n## Brand Personality\n');
      if (identity.traits && identity.traits.length > 0) {
        sections.push(`**Traits**: ${identity.traits.join(', ')}`);
      }
      if (identity.voiceTone) {
        sections.push(`**Voice & Tone**: ${identity.voiceTone}`);
      }
      if (identity.emotionalResonance && identity.emotionalResonance.length > 0) {
        sections.push(`**Emotional Resonance**: ${identity.emotionalResonance.join(', ')}`);
      }
      if (identity.designPrinciples && identity.designPrinciples.length > 0) {
        sections.push('\n### Design Principles\n');
        sections.push(identity.designPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n'));
      }
    }

    return sections.join('\n');
  }

  // ============================================
  // EXPORT FORMAT FILES (P2)
  // ============================================

  /**
   * Add export format files (lazy-generated on access)
   */
  private addExportFiles(): void {
    // Create export directories
    this.directories.add('exports');
    this.directories.add('exports/css');
    this.directories.add('exports/json');
    this.directories.add('exports/scss');

    // Add INDEX.json for discoverability
    const exportIndex = {
      formats: [
        { path: 'exports/css/tokens.css', description: 'CSS custom properties' },
        { path: 'exports/json/tokens.json', description: 'Design Tokens Community Group format' },
        { path: 'exports/scss/_variables.scss', description: 'SCSS variables' },
      ],
      note: 'Files are generated on-demand from the current design system state'
    };
    this.files.set('exports/INDEX.json', JSON.stringify(exportIndex, null, 2));

    // Pre-generate export files
    this.files.set('exports/css/tokens.css', this.generateCSSTokens());
    this.files.set('exports/json/tokens.json', this.generateDTCGFormat());
    this.files.set('exports/scss/_variables.scss', this.generateSCSSVariables());
  }

  /**
   * Generate CSS custom properties
   */
  private generateCSSTokens(): string {
    const lines: string[] = [
      '/**',
      ' * Design System Tokens',
      ' * Auto-generated - do not edit manually',
      ' */',
      '',
      ':root {'
    ];

    for (const [, node] of this.graph.nodes) {
      const varName = `--${node.name.replace(/\./g, '-')}`;
      const value = this.getResolvedValue(node);
      if (value !== null) {
        lines.push(`  ${varName}: ${value};`);
      }
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Generate Design Tokens Community Group format
   */
  private generateDTCGFormat(): string {
    const tokens: Record<string, any> = {};

    for (const [, node] of this.graph.nodes) {
      const parts = node.name.split('.');
      let current = tokens;

      // Build nested structure
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }

      // Add token value
      const value = this.getResolvedValue(node);
      current[parts[parts.length - 1]] = {
        $value: value,
        $type: this.mapTypeToDTCG(node.type),
        ...(node.metadata?.description && { $description: node.metadata.description })
      };
    }

    return JSON.stringify(tokens, null, 2);
  }

  /**
   * Generate SCSS variables
   */
  private generateSCSSVariables(): string {
    const lines: string[] = [
      '//',
      '// Design System Tokens',
      '// Auto-generated - do not edit manually',
      '//',
      ''
    ];

    for (const [, node] of this.graph.nodes) {
      const varName = `$${node.name.replace(/\./g, '-')}`;
      const value = this.getResolvedValue(node);
      if (value !== null) {
        lines.push(`${varName}: ${value};`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Get resolved value for a node (handles references and mode maps)
   */
  private getResolvedValue(node: StyleNode): string | null {
    const value = node.value;

    // Handle mode map - use light mode as default
    if (typeof value === 'object' && value !== null && 'light' in value) {
      return String(value.light);
    }

    // Handle reference
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      const resolved = this.graph.resolveNode(node.id, 'light');
      return resolved !== null ? String(resolved) : null;
    }

    return value !== null && value !== undefined ? String(value) : null;
  }

  /**
   * Map StyleType to DTCG type
   */
  private mapTypeToDTCG(type: string): string {
    const typeMap: Record<string, string> = {
      color: 'color',
      dimension: 'dimension',
      fontFamily: 'fontFamily',
      fontWeight: 'fontWeight',
      duration: 'duration',
      cubicBezier: 'cubicBezier',
      number: 'number',
      string: 'string',
      composite: 'composite'
    };
    return typeMap[type] || type;
  }

  /**
   * Helper: Build directory tree
   */
  private buildTree(rootPath: string, maxDepth: number, currentDepth = 0, prefix = ''): string {
    if (currentDepth >= maxDepth) return '';

    const entries = new Map<string, boolean>(); // path -> isDirectory

    // Collect immediate children
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(rootPath)) {
        const relative = filePath.slice(rootPath.length).replace(/^\//, '');
        const parts = relative.split('/');
        
        if (parts.length > 0) {
          const firstPart = parts[0];
          entries.set(firstPart, parts.length > 1);
        }
      }
    }

    const sortedEntries = Array.from(entries.entries()).sort();
    const lines: string[] = [];

    sortedEntries.forEach(([name, isDir], index) => {
      const isLast = index === sortedEntries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const displayName = isDir ? `${name}/` : name;
      
      lines.push(prefix + connector + displayName);

      if (isDir && currentDepth + 1 < maxDepth) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        const subtree = this.buildTree(
          `${rootPath}/${name}`,
          maxDepth,
          currentDepth + 1,
          newPrefix
        );
        if (subtree) lines.push(subtree);
      }
    });

    return lines.join('\n');
  }

  /**
   * Helper: Normalize path
   */
  private normalizePath(path: string): string {
    if (path === '.' || path === './') return '';
    return path.replace(/^\.\//, '').replace(/\/$/, '');
  }

  /**
   * Helper: Check if file path matches search path
   */
  private matchesPath(filePath: string, searchPath: string, recursive: boolean): boolean {
    const normalizedSearch = this.normalizePath(searchPath);
    
    if (normalizedSearch === '') return true;
    if (!filePath.startsWith(normalizedSearch)) return false;
    
    if (!recursive) {
      const relative = filePath.slice(normalizedSearch.length).replace(/^\//, '');
      return !relative.includes('/');
    }

    return true;
  }

  /**
   * Helper: Convert node to file path
   */
  private nodeToPath(node: StyleNode): string {
    // base.color.primary -> tokens/base/color/primary.json
    return `tokens/${node.name.replace(/\./g, '/')}.json`;
  }

  /**
   * Helper: Convert node to JSON representation
   */
  private nodeToJSON(node: StyleNode): any {
    return {
      id: node.id,
      name: node.name,
      layer: node.layer,
      type: node.type,
      value: node.value,
      dependencies: Array.from(node.dependencies),
      dependents: Array.from(node.dependents),
      metadata: node.metadata,
      intent: node.intent,
      tracking: node.tracking,
    };
  }

  /**
   * Helper: Build dependency graph
   */
  private buildDependencyGraph(): any {
    const graph: any = {
      nodes: [],
      edges: [],
      stats: {
        totalDependencies: 0,
        avgDependenciesPerToken: 0,
        maxDependencies: 0,
      }
    };

    let totalDeps = 0;
    let maxDeps = 0;

    for (const [id, node] of this.graph.nodes) {
      graph.nodes.push({
        id: node.id,
        path: node.name,
        layer: node.layer,
        type: node.type,
        dependencyCount: node.dependencies.size,
        dependentCount: node.dependents.size,
      });

      totalDeps += node.dependencies.size;
      maxDeps = Math.max(maxDeps, node.dependencies.size);

      for (const depId of node.dependencies) {
        graph.edges.push({
          from: node.id,
          to: depId,
        });
      }
    }

    graph.stats.totalDependencies = totalDeps;
    graph.stats.avgDependenciesPerToken = totalDeps / this.graph.nodes.size;
    graph.stats.maxDependencies = maxDeps;

    return graph;
  }

  /**
   * Helper: Get layer distribution
   */
  private getLayerDistribution(): any {
    const distribution: Record<string, number> = {};

    for (const [, node] of this.graph.nodes) {
      const layer = node.layer || 'unknown';
      distribution[layer] = (distribution[layer] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Helper: Get type distribution
   */
  private getTypeDistribution(): any {
    const distribution: Record<string, number> = {};

    for (const [, node] of this.graph.nodes) {
      distribution[node.type] = (distribution[node.type] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get all file paths
   */
  getFilePaths(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * Get file content directly
   */
  getFile(path: string): string | undefined {
    return this.files.get(this.normalizePath(path));
  }

  /**
   * Refresh file structure (call when graph changes)
   */
  refresh(): void {
    this.files.clear();
    this.directories.clear();
    this.buildFileStructureSync();
  }
}

