/**
 * JSON-Render Component Catalog
 *
 * IMPORTANT: This catalog defines components for AI-GENERATED UIs only.
 * These are NOT the shadcn/ui components used by the app itself.
 *
 * See src/lib/json-render/index.ts for full architecture documentation.
 *
 * Combined catalog from json-render's web (22) and dashboard (17) components.
 * Total: ~30 unique components for AI-generated UIs.
 *
 * Architecture:
 * - Flat component structure (no nested sub-components like CardHeader)
 * - Props contain all configuration (title, description go directly on Card)
 * - Data binding via paths (valuePath, dataPath, bindPath)
 * - className array for custom Tailwind styling
 *
 * Theming:
 * - Components use CSS variables (--foreground, --background, etc.)
 * - When a design language is generated, its CSS defines these variables
 * - Components automatically adopt the generated theme
 */

import { z } from 'zod';
import { createCatalog, generateCatalogPrompt } from '@json-render/core';

// =============================================================================
// Component Definitions
// =============================================================================

export const catalog = createCatalog({
  name: 'json-render-combined',
  components: {
    // -------------------------------------------------------------------------
    // Layout Components
    // -------------------------------------------------------------------------
    Card: {
      props: z.object({
        title: z.string().nullable().describe('Card title'),
        description: z.string().nullable().describe('Card description'),
        padding: z.enum(['sm', 'md', 'lg']).nullable().describe('Padding size'),
        maxWidth: z.enum(['sm', 'md', 'lg', 'full']).nullable().describe('Max width constraint'),
        centered: z.boolean().nullable().describe('Center horizontally'),
      }),
      hasChildren: true,
      description: 'Container card with optional title and description',
    },

    Grid: {
      props: z.object({
        columns: z.number().min(1).max(4).nullable().describe('Number of columns (1-4)'),
        gap: z.enum(['sm', 'md', 'lg']).nullable().describe('Gap between items'),
      }),
      hasChildren: true,
      description: 'CSS Grid layout. Use columns:1 with className for responsive',
    },

    Stack: {
      props: z.object({
        direction: z.enum(['horizontal', 'vertical']).nullable().describe('Flex direction'),
        gap: z.enum(['sm', 'md', 'lg']).nullable().describe('Gap between items'),
        align: z.enum(['start', 'center', 'end', 'stretch']).nullable().describe('Alignment'),
      }),
      hasChildren: true,
      description: 'Flexbox stack for horizontal or vertical layouts',
    },

    Divider: {
      props: z.object({
        label: z.string().nullable().describe('Optional label in center'),
      }),
      description: 'Visual divider/separator line',
    },

    // -------------------------------------------------------------------------
    // Form Input Components
    // -------------------------------------------------------------------------
    Input: {
      props: z.object({
        label: z.string().describe('Field label'),
        name: z.string().describe('Field name for form data'),
        type: z.enum(['text', 'email', 'password', 'number']).nullable().describe('Input type'),
        placeholder: z.string().nullable().describe('Placeholder text'),
      }),
      description: 'Single-line text input',
    },

    Textarea: {
      props: z.object({
        label: z.string().describe('Field label'),
        name: z.string().describe('Field name'),
        placeholder: z.string().nullable().describe('Placeholder text'),
        rows: z.number().nullable().describe('Number of rows'),
      }),
      description: 'Multi-line text input',
    },

    Select: {
      props: z.object({
        label: z.string().nullable().describe('Field label'),
        name: z.string().nullable().describe('Field name (web forms)'),
        bindPath: z.string().nullable().describe('Data path to bind value (dashboard)'),
        options: z.array(
          z.union([
            z.string(),
            z.object({
              value: z.string(),
              label: z.string(),
            }),
          ])
        ).describe('Array of options (strings or {value, label})'),
        placeholder: z.string().nullable().describe('Placeholder text'),
      }),
      description: 'Dropdown select input',
    },

    Checkbox: {
      props: z.object({
        label: z.string().describe('Checkbox label'),
        name: z.string().describe('Field name'),
        checked: z.boolean().nullable().describe('Initial checked state'),
      }),
      description: 'Boolean checkbox input',
    },

    Radio: {
      props: z.object({
        label: z.string().describe('Group label'),
        name: z.string().describe('Field name'),
        options: z.array(z.string()).describe('Array of option labels'),
      }),
      description: 'Radio button group',
    },

    Switch: {
      props: z.object({
        label: z.string().describe('Switch label'),
        name: z.string().describe('Field name'),
        checked: z.boolean().nullable().describe('Initial state'),
      }),
      description: 'Toggle switch',
    },

    DatePicker: {
      props: z.object({
        label: z.string().describe('Field label'),
        valuePath: z.string().describe('Data path to bind value'),
      }),
      description: 'Date picker input with data binding',
    },

    // -------------------------------------------------------------------------
    // Action Components
    // -------------------------------------------------------------------------
    Button: {
      props: z.object({
        label: z.string().describe('Button text'),
        variant: z.enum(['primary', 'secondary', 'danger', 'ghost']).nullable().describe('Visual style'),
        action: z.object({
          name: z.string().describe('Action name to trigger'),
        }).nullable().describe('Action to trigger on click'),
        disabled: z.boolean().nullable().describe('Disabled state'),
      }),
      description: 'Clickable button with optional action',
    },

    Link: {
      props: z.object({
        label: z.string().describe('Link text'),
        href: z.string().describe('Link URL'),
      }),
      description: 'Anchor link',
    },

    // -------------------------------------------------------------------------
    // Typography Components
    // -------------------------------------------------------------------------
    Heading: {
      props: z.object({
        text: z.string().describe('Heading text'),
        level: z.union([
          z.enum(['h1', 'h2', 'h3', 'h4']),
          z.number().min(1).max(4),
        ]).nullable().describe('Heading level (1-4 or h1-h4)'),
      }),
      description: 'Section heading (h1-h4)',
    },

    Text: {
      props: z.object({
        content: z.string().describe('Text content'),
        variant: z.enum(['body', 'caption', 'label', 'muted']).nullable().describe('Text style'),
        color: z.enum(['default', 'muted', 'success', 'warning', 'danger']).nullable().describe('Text color'),
      }),
      description: 'Paragraph or inline text',
    },

    // -------------------------------------------------------------------------
    // Data Display Components
    // -------------------------------------------------------------------------
    Metric: {
      props: z.object({
        label: z.string().describe('Metric label'),
        valuePath: z.string().describe('Data path to value (e.g., "/analytics/revenue")'),
        format: z.enum(['number', 'currency', 'percent']).nullable().describe('Value format'),
        trend: z.enum(['up', 'down', 'neutral']).nullable().describe('Trend indicator'),
        trendValue: z.string().nullable().describe('Trend value text (e.g., "+15%")'),
      }),
      description: 'Single metric display with data binding',
    },

    Chart: {
      props: z.object({
        type: z.enum(['bar', 'line', 'pie', 'area']).describe('Chart type'),
        dataPath: z.string().describe('Data path to array'),
        title: z.string().nullable().describe('Chart title'),
        height: z.number().nullable().describe('Chart height in pixels'),
      }),
      description: 'Data visualization chart',
    },

    BarGraph: {
      props: z.object({
        title: z.string().nullable().describe('Chart title'),
        data: z.array(z.object({
          label: z.string(),
          value: z.number(),
        })).describe('Array of {label, value} data points'),
      }),
      description: 'Vertical bar chart',
    },

    LineGraph: {
      props: z.object({
        title: z.string().nullable().describe('Chart title'),
        data: z.array(z.object({
          label: z.string(),
          value: z.number(),
        })).describe('Array of {label, value} data points'),
      }),
      description: 'Line chart with points',
    },

    Table: {
      props: z.object({
        title: z.string().nullable().describe('Table title'),
        dataPath: z.string().describe('Data path to array of rows'),
        columns: z.array(z.object({
          key: z.string().describe('Property key in row data'),
          label: z.string().describe('Column header label'),
          format: z.enum(['text', 'currency', 'date', 'badge']).nullable().describe('Cell format'),
        })).describe('Column definitions'),
      }),
      description: 'Data table with column definitions',
    },

    List: {
      props: z.object({
        dataPath: z.string().describe('Data path to array'),
        emptyMessage: z.string().nullable().describe('Message when list is empty'),
      }),
      hasChildren: true,
      description: 'Render a list from array data',
    },

    Image: {
      props: z.object({
        src: z.string().describe('Image URL'),
        alt: z.string().describe('Alt text'),
        width: z.number().nullable().describe('Width in pixels'),
        height: z.number().nullable().describe('Height in pixels'),
      }),
      description: 'Image element',
    },

    Avatar: {
      props: z.object({
        src: z.string().nullable().describe('Image URL'),
        name: z.string().describe('User name (for fallback initials)'),
        size: z.enum(['sm', 'md', 'lg']).nullable().describe('Avatar size'),
      }),
      description: 'User avatar with fallback initials',
    },

    Badge: {
      props: z.object({
        text: z.string().describe('Badge text'),
        variant: z.enum(['default', 'success', 'warning', 'danger', 'info']).nullable().describe('Badge style'),
      }),
      description: 'Small status badge',
    },

    Alert: {
      props: z.object({
        type: z.enum(['info', 'success', 'warning', 'error']).describe('Alert type'),
        title: z.string().describe('Alert title'),
        message: z.string().nullable().describe('Alert message body'),
        dismissible: z.boolean().nullable().describe('Can be dismissed'),
      }),
      description: 'Alert/notification banner',
    },

    Progress: {
      props: z.object({
        value: z.number().describe('Progress value (0-100)'),
        max: z.number().nullable().describe('Maximum value (default 100)'),
        label: z.string().nullable().describe('Progress label'),
      }),
      description: 'Progress bar',
    },

    Rating: {
      props: z.object({
        value: z.number().describe('Rating value'),
        max: z.number().nullable().describe('Maximum rating (default 5)'),
        label: z.string().nullable().describe('Rating label'),
      }),
      description: 'Star rating display',
    },

    Empty: {
      props: z.object({
        title: z.string().describe('Empty state title'),
        description: z.string().nullable().describe('Empty state description'),
      }),
      description: 'Empty state placeholder',
    },

    // -------------------------------------------------------------------------
    // Utility Components
    // -------------------------------------------------------------------------
    Form: {
      props: z.object({
        title: z.string().nullable().describe('Form title'),
      }),
      hasChildren: true,
      description: 'Form wrapper with optional title',
    },
  },

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  actions: {
    // Dashboard actions
    export_report: { description: 'Export the current dashboard to PDF' },
    refresh_data: { description: 'Refresh all metrics and charts' },
    view_details: { description: 'View detailed information' },
    apply_filter: { description: 'Apply the current filter settings' },
    // Form actions
    submit: {
      params: z.object({
        formId: z.string().nullable(),
      }),
      description: 'Submit a form',
    },
    navigate: {
      params: z.object({
        path: z.string(),
      }),
      description: 'Navigate to a path',
    },
  },

  validation: 'strict',
});

// =============================================================================
// Exports
// =============================================================================

/** Auto-generated AI prompt from catalog */
export const catalogPrompt = generateCatalogPrompt(catalog);

/** Re-export types */
export type UICatalog = typeof catalog;

/**
 * Component categories for reference
 */
export const componentCategories = {
  layout: ['Card', 'Grid', 'Stack', 'Divider'],
  forms: ['Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Switch', 'DatePicker'],
  actions: ['Button', 'Link'],
  typography: ['Heading', 'Text'],
  dataDisplay: ['Metric', 'Chart', 'BarGraph', 'LineGraph', 'Table', 'List', 'Image', 'Avatar', 'Badge', 'Alert', 'Progress', 'Rating', 'Empty'],
  utility: ['Form'],
};

/** Full component list */
export const componentList = catalog.componentNames;
