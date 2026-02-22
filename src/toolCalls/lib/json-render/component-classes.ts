/**
 * Component Class Inventory
 *
 * Defines all x-* classes that the design language system generates CSS for.
 * Components use these classes statically - styling comes from generated CSS.
 */

export const COMPONENT_CLASS_INVENTORY = {
  layout: [
    'x-card',
    'x-card-header',
    'x-card-description',
    'x-card-body',
    'x-card-footer',
    'x-form',
    'x-form-title',
    'x-grid',
    'x-grid-2',
    'x-grid-3',
    'x-grid-4',
    'x-stack',
    'x-stack-horizontal',
    'x-stack-gap-sm',
    'x-stack-gap-md',
    'x-stack-gap-lg',
    'x-divider',
  ],
  form: [
    'x-label',
    'x-input',
    'x-input-error',
    'x-textarea',
    'x-select',
    'x-select-dropdown',
    'x-select-option',
    'x-select-option-selected',
    'x-checkbox',
    'x-checkbox-box',
    'x-checkbox-checked',
    'x-radio',
    'x-radio-circle',
    'x-radio-checked',
    'x-switch',
    'x-switch-track',
    'x-switch-checked',
    'x-switch-thumb',
    'x-datepicker',
    'x-datepicker-input',
  ],
  buttons: [
    'x-btn',
    'x-btn-primary',
    'x-btn-secondary',
    'x-btn-ghost',
    'x-btn-danger',
    'x-btn-disabled',
    'x-link',
  ],
  typography: [
    'x-heading',
    'x-heading-1',
    'x-heading-2',
    'x-heading-3',
    'x-heading-4',
    'x-text',
    'x-text-muted',
    'x-text-caption',
  ],
  feedback: [
    'x-badge',
    'x-badge-success',
    'x-badge-warning',
    'x-badge-error',
    'x-alert',
    'x-alert-title',
    'x-alert-message',
    'x-alert-info',
    'x-alert-success',
    'x-alert-warning',
    'x-alert-error',
    'x-progress',
    'x-progress-bar',
    'x-progress-label',
    'x-rating',
    'x-rating-star',
    'x-rating-star-filled',
    'x-rating-star-empty',
    'x-rating-label',
  ],
  dataDisplay: [
    'x-avatar',
    'x-avatar-sm',
    'x-avatar-md',
    'x-avatar-lg',
    'x-avatar-initials',
    'x-image',
    'x-metric',
    'x-metric-label',
    'x-metric-value',
    'x-metric-trend',
    'x-metric-trend-up',
    'x-metric-trend-down',
    'x-table',
    'x-table-title',
    'x-table-header',
    'x-table-th',
    'x-table-body',
    'x-table-row',
    'x-table-td',
    'x-table-badge',
    'x-list',
    'x-list-item',
    'x-empty',
    'x-empty-title',
    'x-empty-description',
  ],
  charts: [
    'x-chart',
    'x-chart-title',
    'x-chart-bars',
    'x-chart-bar',
    'x-chart-bar-label',
    'x-bargraph',
    'x-bargraph-title',
    'x-bargraph-bars',
    'x-bargraph-bar',
    'x-bargraph-bar-value',
    'x-bargraph-bar-label',
    'x-linegraph',
    'x-linegraph-title',
    'x-linegraph-svg',
    'x-linegraph-grid',
    'x-linegraph-line',
    'x-linegraph-point',
    'x-linegraph-labels',
    'x-linegraph-label',
  ],
} as const;

/**
 * Get all classes as a flat array
 */
export function getAllClasses(): string[] {
  return Object.values(COMPONENT_CLASS_INVENTORY).flat();
}

/**
 * Get classes formatted for LLM prompt
 */
export function getClassInventoryForPrompt(): string {
  const sections = [
    { name: 'Layout', classes: COMPONENT_CLASS_INVENTORY.layout },
    { name: 'Form Controls', classes: COMPONENT_CLASS_INVENTORY.form },
    { name: 'Buttons & Links', classes: COMPONENT_CLASS_INVENTORY.buttons },
    { name: 'Typography', classes: COMPONENT_CLASS_INVENTORY.typography },
    { name: 'Feedback', classes: COMPONENT_CLASS_INVENTORY.feedback },
    { name: 'Data Display', classes: COMPONENT_CLASS_INVENTORY.dataDisplay },
    { name: 'Charts', classes: COMPONENT_CLASS_INVENTORY.charts },
  ];

  return sections
    .map(
      (section) =>
        `### ${section.name}\n${section.classes.map((c) => `.${c}`).join(', ')}`
    )
    .join('\n\n');
}
