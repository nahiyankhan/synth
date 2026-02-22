/**
 * Relationship Tool Definitions
 * 
 * ⚠️ DEPRECATED: These tools are now replaced by file system queries.
 * 
 * Instead of calling these specialized tools, use executeCommand with:
 * - cat tokens/{label}.json | jq '.relationships[]'
 * - cat relationships/{type}.json
 * - cat brand-principles/{name}.json
 * - grep -r "pattern" tokens/
 * 
 * See FILE_STRUCTURE_GUIDE.md for examples.
 * 
 * These tools are kept temporarily for compatibility but will be removed.
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const QUERY_RELATIONSHIPS_TOOL: ToolDefinition = {
  name: 'queryRelationships',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `⚠️ DEPRECATED: Use executeCommand with file queries instead.

Instead of this tool, use:
  cat tokens/brand-blue.json | jq '.relationships[] | select(.type=="EXPRESSES")'
  cat relationships/expresses.json | jq '.relationships[] | select(.fromLabel=="Brand Blue")'
  
See FILE_STRUCTURE_GUIDE.md for examples.

Old description (for reference):
Query token relationships to understand semantic meaning and constraints.`,
  parameters: {
    tokenId: {
      type: 'string',
      required: false,
      description: 'Filter relationships from this token',
    },
    relationshipType: {
      type: 'string',
      required: false,
      description: 'Filter by relationship type (EXPRESSES, CONSTRAINS, VIOLATES, etc.)',
    },
    targetId: {
      type: 'string',
      required: false,
      description: 'Filter relationships to this target (principle, constraint, context)',
    },
    minStrength: {
      type: 'number',
      required: false,
      description: 'Minimum relationship strength (0.0 to 1.0)',
    },
    includeIncoming: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Include relationships pointing TO this token',
    },
  },
  returns: 'Array of relationships with source, target, type, reason, and strength',
  defer_loading: false,
  input_examples: [
    { tokenId: 'brand-blue', relationshipType: 'EXPRESSES' },
    { relationshipType: 'VIOLATES' },
    { targetId: 'brand-principle-trustworthy', minStrength: 0.8 },
    { tokenId: 'brand-blue', relationshipType: 'DISALLOWED_IN' },
  ],
};

export const GET_TOKEN_IMPACT_TOOL: ToolDefinition = {
  name: 'getTokenImpact',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Analyze the impact of changing a token.
  
Shows:
- Direct dependents (via DERIVES_FROM, ALIASES)
- Transitive dependents (full dependency tree)
- Affected components (via USED_BY)
- Affected brand principles (via EXPRESSES)
- Constraint violations that might occur

This is the key tool for "what breaks if I change this?" questions.`,
  parameters: {
    tokenId: {
      type: 'string',
      required: true,
      description: 'Token to analyze impact for',
    },
    includeTransitive: {
      type: 'boolean',
      required: false,
      default: true,
      description: 'Include full transitive dependency tree',
    },
  },
  returns: 'Impact analysis with dependents, components, principles, and potential issues',
  sideEffects: 'None - read-only analysis',
  defer_loading: false,
  input_examples: [
    { tokenId: 'brand-blue' },
    { tokenId: 'heading-xl', includeTransitive: false },
  ],
};

export const GET_BRAND_ALIGNMENT_TOOL: ToolDefinition = {
  name: 'getBrandAlignment',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Analyze how well tokens express brand principles.
  
Shows:
- Which principles are strongly expressed
- Which principles are under-represented
- Average expression strength per principle
- Tokens that express multiple principles

Useful for questions like:
- "Does my design system express trustworthiness?"
- "Which brand principles need more token support?"
- "What qualities does Brand Blue express?"`,
  parameters: {
    principleId: {
      type: 'string',
      required: false,
      description: 'Filter to specific principle',
    },
    minStrength: {
      type: 'number',
      required: false,
      default: 0.7,
      description: 'Minimum strength to consider "strong"',
    },
  },
  returns: 'Brand alignment analysis with principle coverage and token mappings',
  defer_loading: false,
  input_examples: [
    {},
    { principleId: 'brand-principle-trustworthy' },
    { minStrength: 0.9 },
  ],
};

export const GET_CONSTRAINT_VIOLATIONS_TOOL: ToolDefinition = {
  name: 'getConstraintViolations',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Find all constraint violations in the design system.
  
Shows:
- Tokens that violate rules (via VIOLATES relationships)
- Whether violations are acknowledged
- Constraint type (accessibility, brand, technical, ux)
- Severity (if specified)
- Reason for violation

Critical for:
- Accessibility audits
- Brand guideline compliance
- Quality checks`,
  parameters: {
    constraintType: {
      type: 'string',
      required: false,
      enum: ['accessibility', 'brand', 'technical', 'ux'],
      description: 'Filter by constraint type',
    },
    includeAcknowledged: {
      type: 'boolean',
      required: false,
      default: true,
      description: 'Include acknowledged violations',
    },
    tokenId: {
      type: 'string',
      required: false,
      description: 'Filter to specific token',
    },
  },
  returns: 'Array of violations with token, constraint, reason, and acknowledgement status',
  defer_loading: false,
  input_examples: [
    { constraintType: 'accessibility' },
    { includeAcknowledged: false },
    { tokenId: 'brand-blue' },
  ],
};

export const GET_USAGE_GUIDANCE_TOOL: ToolDefinition = {
  name: 'getUsageGuidance',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Get usage guidance for a token or context.
  
Shows:
- Preferred tokens for a context (via PREFERRED_FOR)
- Disallowed tokens in a context (via DISALLOWED_IN)
- Usage notes and constraints
- When clauses (conditions)

Perfect for:
- "Can I use Brand Blue for error states?"
- "What tokens should I use for primary actions?"
- "What's disallowed in high-emphasis contexts?"`,
  parameters: {
    tokenId: {
      type: 'string',
      required: false,
      description: 'Get guidance for this token',
    },
    contextId: {
      type: 'string',
      required: false,
      description: 'Get guidance for this context',
    },
  },
  returns: 'Usage guidance with preferences, restrictions, and conditions',
  defer_loading: false,
  input_examples: [
    { tokenId: 'brand-blue' },
    { contextId: 'context-primary-action' },
    { tokenId: 'brand-red', contextId: 'context-error-state' },
  ],
};

export const FIND_TOKEN_BY_INTENT_TOOL: ToolDefinition = {
  name: 'findTokenByIntent',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Find tokens by semantic intent rather than name or value.
  
Search by:
- Brand principles expressed
- Usage contexts preferred
- Problem solved (createdFor)
- Brand intent message

This is AI-native search: "Find tokens that express trustworthiness" instead of 
"Find tokens with 'blue' in the name".`,
  parameters: {
    brandPrinciples: {
      type: 'array',
      required: false,
      description: 'Brand principles to match (OR logic)',
    },
    usageContext: {
      type: 'string',
      required: false,
      description: 'Usage context (via PREFERRED_FOR)',
    },
    problemSolved: {
      type: 'string',
      required: false,
      description: 'Problem this token solves',
    },
    minStrength: {
      type: 'number',
      required: false,
      default: 0.6,
      description: 'Minimum relationship strength',
    },
  },
  returns: 'Tokens matching intent criteria with relationship strengths',
  defer_loading: false,
  input_examples: [
    { brandPrinciples: ['trustworthy', 'professional'] },
    { usageContext: 'context-primary-action', minStrength: 0.8 },
    { problemSolved: 'high-contrast-text' },
  ],
};

export const RELATIONSHIP_TOOLS = [
  QUERY_RELATIONSHIPS_TOOL,
  GET_TOKEN_IMPACT_TOOL,
  GET_BRAND_ALIGNMENT_TOOL,
  GET_CONSTRAINT_VIOLATIONS_TOOL,
  GET_USAGE_GUIDANCE_TOOL,
  FIND_TOKEN_BY_INTENT_TOOL,
];

