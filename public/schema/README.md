# Design System Schemas

Cube.js-style semantic layer schemas for the design system. These schemas define how to query and analyze design tokens across multiple dimensions.

## Schema Files

### `tokens.cube.yaml`
Main schema for all design tokens. Includes:
- **Dimensions**: path, layer, type, value, semantic_role, etc.
- **Measures**: count, dependency metrics, usage statistics
- **Segments**: primitives, utilities, composites, deprecated, etc.

### `colors.cube.yaml`
Specialized schema for color analysis. Includes:
- **Color Science**: OKLCH lightness, chroma, hue
- **Color Families**: Hue-based categorization
- **Semantic Roles**: primary, accent, background, text, etc.
- **Accessibility**: Contrast and readability measures

### `typography.cube.yaml`
Specialized schema for typography tokens. Includes:
- **Font Properties**: family, size, weight, line-height
- **Usage Categories**: headings, body, captions, etc.
- **Scale Analysis**: Size distribution and hierarchy

### `dependencies.cube.yaml`
Graph schema for token relationships. Includes:
- **Dependency Edges**: Which tokens reference which
- **Cross-Layer Analysis**: Dependencies across layers
- **Graph Metrics**: Dependency depth, fan-out, etc.

## Schema Format

Schemas follow the Cube.js format:

```yaml
cube: CubeName
sql: SELECT statement or table reference

dimensions:
  - name: dimension_name
    sql: SQL expression
    type: string | number | boolean | time
    description: Human-readable description

measures:
  - name: measure_name
    sql: SQL expression (optional for count)
    type: count | sum | avg | min | max | countDistinct
    description: What this measures

segments:
  - name: segment_name
    sql: WHERE clause condition
    description: Subset of data
```

## Usage

These schemas serve multiple purposes:

### 1. Documentation
Self-documenting structure showing:
- What dimensions exist (how to slice data)
- What measures are available (what to calculate)
- What segments are defined (common filters)

### 2. File-System Agent Queries
AI models can explore schemas using standard commands:

```bash
# View schema structure
cat schema/colors.cube.yaml

# Find color-related dimensions
grep "dimension" schema/colors.cube.yaml

# Search across all schemas
grep -r "semantic_role" schema/

# Find all measures
find schema/ -name "*.cube.yaml" -exec grep -H "type: count" {} \;
```

### 3. Query Templates
Schemas define valid query structures:

```typescript
// Example query based on colors.cube.yaml
{
  dimensions: ['Colors.hue_family', 'Colors.lightness_category'],
  measures: ['Colors.count', 'Colors.avg_chroma'],
  segments: ['Colors.chromatic']
}
```

## Schema Design Principles

1. **Self-Documenting**: Every dimension and measure has a description
2. **Semantic**: Dimensions represent business concepts, not just data fields
3. **Layered**: Separate schemas for different analysis needs
4. **Graph-Aware**: Dependencies schema captures relationships
5. **Accessible**: AI models can reason over YAML structure

## Extending Schemas

To add new dimensions or measures:

1. Add to appropriate schema file
2. Follow Cube.js naming conventions (snake_case)
3. Include description
4. Specify correct type
5. Use SQL expressions for computed values

Example:

```yaml
dimensions:
  - name: contrast_category
    sql: >
      CASE 
        WHEN (metadata->'colorScience'->'oklch'->>'l')::float > 70 THEN 'light'
        WHEN (metadata->'colorScience'->'oklch'->>'l')::float > 30 THEN 'medium'
        ELSE 'dark'
      END
    type: string
    description: Contrast category based on OKLCH lightness
```

## Virtual vs. Real Database

These schemas are designed to work with:

1. **Virtual Queries** (current): In-memory StyleGraph with Cube.js-style query interface
2. **Real Database** (future): Export to Postgres/SQLite and run actual Cube.js

The SQL expressions serve as:
- Documentation of how dimensions are computed
- Templates for virtual query engine
- Ready-to-use queries if migrating to real database

