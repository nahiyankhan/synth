/**
 * String utility functions
 */

/**
 * Converts a camelCase or PascalCase string to kebab-case.
 * @example toKebabCase('backgroundColor') // 'background-color'
 * @example toKebabCase('FontSizeXL') // 'font-size-x-l'
 */
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
