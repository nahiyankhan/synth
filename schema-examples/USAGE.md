# Schema Examples Usage Guide

This directory contains example outputs from the virtual file system.

## How to Use the File System Agent

### In the AI Chat

You can now use file system commands to explore the design system:

```
User: "Show me the color schema"
AI: executeCommand({ command: "cat schema/colors.cube.yaml" })

User: "Find all error tokens"
AI: executeCommand({ command: "find tokens/ -name '*error*'" })

User: "Search for primary colors"
AI: executeCommand({ command: "grep -r 'primary' tokens/" })

User: "What are the system statistics?"
AI: executeCommand({ command: "cat metadata/stats.json" })
```

### Example Queries

1. **Explore schemas**:
   - `cat schema/tokens.cube.yaml` - Main token schema
   - `cat schema/colors.cube.yaml` - Color analysis schema
   - `grep "measure" schema/*.yaml` - Find all measures

2. **Search tokens**:
   - `grep -r "primary" tokens/` - Find "primary" in all tokens
   - `grep -ri "background" tokens/semantic/` - Case-insensitive search
   - `find tokens/ -name "*error*"` - Find error-related tokens

3. **Explore structure**:
   - `ls tokens/` - List top-level directories
   - `ls -l tokens/base/color/` - Detailed listing
   - `tree -L 2 tokens/` - Directory tree (2 levels)

4. **System analysis**:
   - `cat metadata/stats.json` - Overall statistics
   - `cat metadata/layers.json` - Layer distribution
   - `cat metadata/dependencies.json` - Dependency graph

5. **Token details**:
   - `cat tokens/base/color/constant/black.json` - Specific token
   - `wc schema/tokens.cube.yaml` - Line count

## Example Files in This Directory

1. **01-ls-root.txt** - Root directory listing
2. **02-cat-colors-schema.yaml** - Color schema contents
3. **03-grep-primary.txt** - Search results for "primary"
4. **04-find-error-tokens.txt** - Error token locations
5. **05-tree-tokens.txt** - Token directory tree
6. **06-cat-black-token.json** - Example token details
7. **07-stats.json** - System statistics
8. **08-layers.json** - Layer distribution
9. **09-wc-tokens-schema.txt** - Word count of schema
10. **10-ls-base-colors.txt** - Base color listing

## Comparing with Traditional Tools

### Traditional Approach
```
User: "Show me all color tokens"
AI: searchTokens({ type: "color", response_mode: "full" })
→ Returns 456 tokens, large response
```

### File System Approach
```
User: "Show me all color tokens"
AI: executeCommand({ command: "ls tokens/base/color/" })
→ Returns directory listing, compact response

User: "Show me details of one"
AI: executeCommand({ command: "cat tokens/base/color/brand.json" })
→ Returns specific token details
```

## Benefits

1. **Familiar Interface**: Standard Unix commands
2. **Incremental Exploration**: Start broad, drill down
3. **Self-Documenting**: Schemas explain structure
4. **Efficient**: Model can reason about what to query
5. **Flexible**: Combine commands as needed

## Advanced Usage

### Chaining Commands (simulated)

While you can't chain commands directly, you can describe what you want:

```
User: "Show me all primitive color tokens sorted by name"
AI: 
  1. executeCommand({ command: "find tokens/base/color/ -name '*.json'" })
  2. Processes results and presents sorted list
```

### Using Schemas for Analysis

```
User: "What dimensions are available for color analysis?"
AI: executeCommand({ command: "grep 'name:' schema/colors.cube.yaml" })
→ Lists all available dimensions

User: "Show me the OKLCH data for a color"
AI: executeCommand({ command: "cat tokens/base/color/brand.json" })
→ Shows colorScience.oklch data
```

## Integration with Existing Tools

File system commands work alongside existing tools:

- **Exploration**: Use `executeCommand` for browsing
- **Modification**: Use `updateToken`, `createToken` for changes
- **Analysis**: Use `executeCommand` for metadata, traditional tools for complex graphs
- **History**: Use `undoChange`, `redoChange` for version control

## Next Steps

Try these queries in the AI chat:

1. "Show me the color schema structure"
2. "Find all tokens with 'error' in their name"
3. "What are the main token categories?"
4. "Show me a specific token's dependencies"
5. "What's the distribution of tokens by layer?"

