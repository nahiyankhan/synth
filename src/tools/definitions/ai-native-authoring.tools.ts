/**
 * AI-Native Authoring Tool Definitions
 * Tools for modifying the relationship-first design system
 * 
 * Philosophy:
 * - Tokens are defined by their relationships, not paths
 * - AI can explore the system using executeCommand (grep, cat, jq)
 * - AI can modify the system using these authoring tools
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const CREATE_AI_TOKEN_TOOL: ToolDefinition = {
  name: 'createToken',
  version: '2.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Create a new AI-native token with relationships.

Instead of specifying a path, you define:
- id: Unique identifier (e.g., "brand-blue")
- label: Human-readable name (e.g., "Brand Blue")
- value: The actual design value
- relationships: What this token expresses, derives from, constrains, etc.

The token's meaning comes from its relationships, not its position in a hierarchy.`,
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Unique token ID (e.g., "brand-blue", "heading-xl")',
    },
    label: {
      type: 'string',
      required: true,
      description: 'Human-readable label (e.g., "Brand Blue", "Heading XL")',
    },
    value: {
      type: 'any',
      required: true,
      description: 'Token value (hex color, px size, font name, etc.)',
    },
    relationships: {
      type: 'array',
      required: false,
      default: [],
      description: `Array of relationships defining token semantics. Each relationship has:
        - type: EXPRESSES, DERIVES_FROM, CONSTRAINS, VIOLATES, PREFERRED_FOR, etc.
        - target: ID of related entity (token, principle, context, constraint)
        - reason: Why this relationship exists
        - strength: 0-1 for EXPRESSES relationships
        - when: conditions for PREFERRED_FOR, DISALLOWED_IN
        - metadata: additional data (passes, ratio, acknowledged, etc.)`,
    },
    context: {
      type: 'object',
      required: false,
      description: `Optional context metadata:
        - createdFor: Problem this solves
        - brandIntent: Semantic message
        - colorScience: OKLCH values if computed`,
    },
  },
  returns: 'Created token with ID, relationships, and version',
  sideEffects: 'Adds new token to StyleGraph, persists to IndexedDB, adds to history',
  defer_loading: false,
  input_examples: [
    {
      id: 'brand-blue',
      label: 'Brand Blue',
      value: '#0066CC',
      relationships: [
        {
          type: 'EXPRESSES',
          target: 'brand-principle-trustworthy',
          reason: 'Blue evokes trust and stability',
          strength: 0.9,
        },
        {
          type: 'EXPRESSES',
          target: 'brand-principle-professional',
          reason: 'Corporate blue conveys professionalism',
          strength: 0.85,
        },
        {
          type: 'PREFERRED_FOR',
          target: 'context-primary-action',
          reason: 'Primary brand color for CTAs',
          when: ['high-emphasis', 'interactive'],
        },
        {
          type: 'CONSTRAINS',
          target: 'constraint-wcag-aa',
          reason: 'Passes WCAG AA on white background',
          metadata: { passes: true, ratio: 4.8 },
        },
      ],
      context: {
        brandIntent: 'trustworthy professional action',
        colorScience: {
          oklch: { l: 0.55, c: 0.15, h: 250 },
        },
      },
    },
    {
      id: 'text-secondary',
      label: 'Text Secondary',
      value: 'brand-blue', // Reference to another token
      relationships: [
        {
          type: 'DERIVES_FROM',
          target: 'brand-blue',
          reason: 'Semantic alias for secondary text',
        },
        {
          type: 'PREFERRED_FOR',
          target: 'context-secondary-text',
          reason: 'Standard secondary text color',
        },
      ],
    },
  ],
};

export const UPDATE_TOKEN_TOOL: ToolDefinition = {
  name: 'updateToken',
  version: '2.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Update an existing token's value, label, or relationships.

You can:
- Change the value
- Update the label
- Add/remove/modify relationships
- Update context metadata

The token's ID remains the same.`,
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Token ID to update',
    },
    label: {
      type: 'string',
      required: false,
      description: 'New label (optional)',
    },
    value: {
      type: 'any',
      required: false,
      description: 'New value (optional)',
    },
    relationships: {
      type: 'array',
      required: false,
      description: 'New relationships array (replaces existing). Omit to keep unchanged.',
    },
    addRelationships: {
      type: 'array',
      required: false,
      description: 'Relationships to add (preserves existing)',
    },
    removeRelationships: {
      type: 'array',
      required: false,
      description: 'Relationships to remove (by type and target)',
    },
    context: {
      type: 'object',
      required: false,
      description: 'Update context metadata',
    },
    changeReason: {
      type: 'string',
      required: false,
      description: 'Reason for this change (for history)',
    },
  },
  returns: 'Updated token with change summary and version',
  sideEffects: 'Modifies StyleGraph, updates dependents, persists to IndexedDB, adds to history',
  defer_loading: false,
  input_examples: [
    {
      id: 'brand-blue',
      value: '#0052CC',
      changeReason: 'Darker for better contrast',
    },
    {
      id: 'brand-blue',
      addRelationships: [
        {
          type: 'VIOLATES',
          target: 'constraint-wcag-aaa',
          reason: 'Does not meet AAA standard',
          metadata: { ratio: 4.8, required: 7.0 },
          acknowledged: true,
        },
      ],
    },
    {
      id: 'text-secondary',
      removeRelationships: [
        { type: 'DERIVES_FROM', target: 'old-blue' },
      ],
      addRelationships: [
        { type: 'DERIVES_FROM', target: 'brand-blue' },
      ],
    },
  ],
};

export const DELETE_TOKEN_TOOL: ToolDefinition = {
  name: 'deleteToken',
  version: '2.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Delete a token from the design system.

Before deletion, use executeCommand to check for dependencies:
  grep -r "target-id" tokens/ | jq -r '.id'
  
This finds all tokens that reference the one you're about to delete.`,
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Token ID to delete',
    },
    force: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Force deletion even if other tokens reference this one',
    },
  },
  returns: 'Deletion confirmation with list of affected tokens',
  sideEffects: 'Removes token from StyleGraph, may break dependents, persists to IndexedDB, adds to history',
  defer_loading: true,
  input_examples: [
    { id: 'deprecated-color', force: false },
    { id: 'old-brand-blue', force: true },
  ],
};

export const ADD_RELATIONSHIP_TOOL: ToolDefinition = {
  name: 'addRelationship',
  version: '1.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Add a relationship to an existing token.

This is a convenience tool for adding single relationships without updating the entire token.`,
  parameters: {
    tokenId: {
      type: 'string',
      required: true,
      description: 'Token to add relationship to',
    },
    relationship: {
      type: 'object',
      required: true,
      description: 'Relationship to add (type, target, reason, strength, metadata, etc.)',
    },
  },
  returns: 'Updated token with new relationship',
  sideEffects: 'Modifies token in StyleGraph, persists to IndexedDB',
  defer_loading: false,
  input_examples: [
    {
      tokenId: 'brand-blue',
      relationship: {
        type: 'DISALLOWED_IN',
        target: 'context-error-state',
        reason: 'Blue conveys trust, not urgency',
        when: ['high-severity'],
      },
    },
  ],
};

export const REMOVE_RELATIONSHIP_TOOL: ToolDefinition = {
  name: 'removeRelationship',
  version: '1.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Remove a relationship from a token.

Specify the relationship by type and target.`,
  parameters: {
    tokenId: {
      type: 'string',
      required: true,
      description: 'Token to remove relationship from',
    },
    relationshipType: {
      type: 'string',
      required: true,
      description: 'Relationship type (EXPRESSES, DERIVES_FROM, etc.)',
    },
    targetId: {
      type: 'string',
      required: true,
      description: 'Target entity ID',
    },
  },
  returns: 'Updated token with relationship removed',
  sideEffects: 'Modifies token in StyleGraph, persists to IndexedDB',
  defer_loading: false,
  input_examples: [
    {
      tokenId: 'brand-blue',
      relationshipType: 'VIOLATES',
      targetId: 'constraint-wcag-aaa',
    },
  ],
};

export const CREATE_BRAND_PRINCIPLE_TOOL: ToolDefinition = {
  name: 'createBrandPrinciple',
  version: '1.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Create a new brand principle that tokens can express.

Brand principles define the semantic qualities of your brand (trustworthy, playful, professional, etc.).
Tokens express these principles via EXPRESSES relationships.`,
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Principle ID (e.g., "brand-principle-trustworthy")',
    },
    label: {
      type: 'string',
      required: true,
      description: 'Human-readable name (e.g., "Trustworthy")',
    },
    description: {
      type: 'string',
      required: true,
      description: 'What this principle means for the brand',
    },
    examples: {
      type: 'array',
      required: false,
      description: 'Example manifestations of this principle',
    },
  },
  returns: 'Created brand principle',
  sideEffects: 'Adds principle to system, available for EXPRESSES relationships',
  defer_loading: false,
  input_examples: [
    {
      id: 'brand-principle-trustworthy',
      label: 'Trustworthy',
      description: 'Our brand evokes trust, reliability, and stability',
      examples: ['calm blues', 'stable typography', 'generous spacing'],
    },
  ],
};

export const CREATE_USAGE_CONTEXT_TOOL: ToolDefinition = {
  name: 'createUsageContext',
  version: '1.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Create a usage context that defines where/when tokens should be used.

Contexts represent situations like "primary action", "error state", "high emphasis", etc.
Tokens can be PREFERRED_FOR or DISALLOWED_IN specific contexts.`,
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Context ID (e.g., "context-primary-action")',
    },
    label: {
      type: 'string',
      required: true,
      description: 'Human-readable name (e.g., "Primary Action")',
    },
    description: {
      type: 'string',
      required: true,
      description: 'When/where this context applies',
    },
    conditions: {
      type: 'array',
      required: false,
      description: 'Conditions that define this context',
    },
  },
  returns: 'Created usage context',
  sideEffects: 'Adds context to system, available for PREFERRED_FOR/DISALLOWED_IN relationships',
  defer_loading: false,
  input_examples: [
    {
      id: 'context-primary-action',
      label: 'Primary Action',
      description: 'High-emphasis interactive elements like primary CTAs',
      conditions: ['high-emphasis', 'interactive', 'user-facing'],
    },
  ],
};

export const CREATE_CONSTRAINT_TOOL: ToolDefinition = {
  name: 'createConstraint',
  version: '1.0.0',
  category: 'authoring',
  domainAwareness: 'universal',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: `Create a design constraint that tokens can satisfy or violate.

Constraints represent rules like WCAG AA, brand guidelines, technical limits, etc.
Tokens can CONSTRAINS (passes) or VIOLATES relationships to constraints.`,
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Constraint ID (e.g., "constraint-wcag-aa")',
    },
    label: {
      type: 'string',
      required: true,
      description: 'Human-readable name (e.g., "WCAG AA")',
    },
    type: {
      type: 'string',
      required: true,
      enum: ['accessibility', 'brand', 'technical', 'ux'],
      description: 'Constraint category',
    },
    description: {
      type: 'string',
      required: true,
      description: 'What this constraint requires',
    },
    severity: {
      type: 'string',
      required: false,
      enum: ['critical', 'high', 'medium', 'low'],
      description: 'Violation severity',
    },
  },
  returns: 'Created constraint',
  sideEffects: 'Adds constraint to system, available for CONSTRAINS/VIOLATES relationships',
  defer_loading: false,
  input_examples: [
    {
      id: 'constraint-wcag-aa',
      label: 'WCAG AA Contrast',
      type: 'accessibility',
      description: 'Text must have 4.5:1 contrast ratio minimum',
      severity: 'critical',
    },
  ],
};

export const AI_NATIVE_AUTHORING_TOOLS = [
  CREATE_AI_TOKEN_TOOL,
  UPDATE_TOKEN_TOOL,
  DELETE_TOKEN_TOOL,
  ADD_RELATIONSHIP_TOOL,
  REMOVE_RELATIONSHIP_TOOL,
  CREATE_BRAND_PRINCIPLE_TOOL,
  CREATE_USAGE_CONTEXT_TOOL,
  CREATE_CONSTRAINT_TOOL,
];

