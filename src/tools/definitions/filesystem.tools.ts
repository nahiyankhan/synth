/**
 * File System Tool Definitions
 * Commands for exploring AND MODIFYING the design system via file system interface
 *
 * Inspired by Vercel's filesystem-first agent approach:
 * https://vercel.com/blog/how-to-build-agents-with-filesystems-and-bash
 */

import { ToolDefinition } from '@/types/toolRegistry';

export const EXECUTE_COMMAND_TOOL: ToolDefinition = {
  name: 'executeCommand',
  version: '2.0.0',
  category: 'query', // Also supports modify, but 'query' is primary
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Execute file system commands to explore AND MODIFY the design system.

The design system is organized as a virtual file system:
- schema/ - Cube.js-style semantic layer schemas
- tokens/ - Individual token files (READ/WRITE)
- brand/ - Brand context from generation (strategy, identity, guidelines)
- exports/ - Auto-generated export formats (CSS, JSON, SCSS)
- metadata/ - System statistics and dependency graphs

## Read Commands
- cat <file> - Read file contents
- grep [-r] [-i] <pattern> [path] - Search for patterns
- find <path> [-name <pattern>] - Find files by name
- ls [-la] [path] - List directory contents
- tree [-L <depth>] [path] - Show directory tree
- wc <file> - Count lines, words, characters

## Write Commands (tokens/ directory only)
- echo '<json>' > tokens/path.json - Create/update token
- rm [-f] tokens/path.json - Delete token (warns if has dependents)
- mkdir [-p] tokens/new/path - Create token directory

## Examples

### Exploration
- "cat brand/summary.md" - View brand summary
- "grep -r primary tokens/" - Find all tokens with "primary"
- "cat exports/css/tokens.css" - Get CSS custom properties
- "ls tokens/base/color/" - List color tokens

### Modification
- "echo '{"id":"brand-blue","name":"brand.blue","type":"color","value":"#0066CC"}' > tokens/brand/blue.json"
- "rm tokens/deprecated/old-color.json"
- "mkdir -p tokens/semantic/brand"`,
  parameters: {
    command: {
      type: 'string',
      required: true,
      description: 'Unix command to execute (read: cat, grep, find, ls, tree, wc; write: echo, rm, mkdir)',
    },
  },
  returns: 'Command output (stdout) with exit code. Write commands also trigger persistence.',
  defer_loading: false,
  input_examples: [
    // Read examples
    { command: 'cat brand/summary.md' },
    { command: 'grep -r primary tokens/' },
    { command: 'cat exports/css/tokens.css' },
    { command: 'find tokens/ -name "*error*"' },
    { command: 'ls tokens/base/color/' },
    { command: 'tree -L 2 tokens/' },
    { command: 'cat metadata/stats.json' },
    // Write examples
    { command: 'echo \'{"id":"test","name":"test.color","type":"color","value":"#FF0000"}\' > tokens/test/color.json' },
    { command: 'rm tokens/deprecated/old.json' },
    { command: 'mkdir -p tokens/semantic/brand' },
  ],
};

export const FILESYSTEM_TOOLS = [
  EXECUTE_COMMAND_TOOL,
];

