/**
 * Content Tool Definitions
 * Tools for working with voice & tone guidelines and content auditing
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const AUDIT_TEXT_TOOL: ToolDefinition = {
  name: 'auditText',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'content',
  supportedTypes: ['other'],
  availableInViews: ['content'],
  description: 'Audit user-written text against voice & tone guidelines using semantic similarity. Returns relevant guidelines that apply to the text with similarity scores.',
  parameters: {
    text: {
      type: 'string',
      required: true,
      description: 'The text to audit against content guidelines',
    },
    topK: {
      type: 'number',
      required: false,
      default: 5,
      description: 'Number of most relevant guidelines to return (default: 5, max: 20)',
    },
  },
  returns: 'Audit results with relevant guidelines, similarity scores, and summary assessment',
  defer_loading: false,
  input_examples: [
    { 
      text: 'Get started with our product today! Click here to sign up now!',
      topK: 5
    },
    { 
      text: 'We believe in creating experiences that empower users to achieve their goals.',
      topK: 3
    },
    {
      text: 'ERROR: Something went wrong. Please try again.',
      topK: 5
    },
  ],
};

export const SEARCH_GUIDELINES_TOOL: ToolDefinition = {
  name: 'searchGuidelines',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'content',
  supportedTypes: ['other'],
  availableInViews: ['content'],
  description: 'Search voice & tone guidelines using semantic search. Find specific rules, examples, or recommendations.',
  parameters: {
    query: {
      type: 'string',
      required: true,
      description: 'Search query for finding relevant guidelines',
    },
    type: {
      type: 'string',
      enum: ['all', 'rule', 'example', 'dont'],
      required: false,
      default: 'all',
      description: 'Filter by guideline type',
    },
    topK: {
      type: 'number',
      required: false,
      default: 5,
      description: 'Number of results to return',
    },
  },
  returns: 'List of relevant guidelines with similarity scores',
  defer_loading: false,
  input_examples: [
    { query: 'error messages', type: 'rule', topK: 3 },
    { query: 'call to action', type: 'example', topK: 5 },
    { query: 'technical jargon', type: 'dont', topK: 3 },
  ],
};

export const CONTENT_TOOLS = [
  AUDIT_TEXT_TOOL,
  SEARCH_GUIDELINES_TOOL,
];

