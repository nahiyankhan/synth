/**
 * Date Formatting Utilities
 *
 * Shared utilities for formatting dates and relative times across the app.
 */

export interface FormatRelativeTimeOptions {
  /** Use abbreviated format (e.g., "5m ago" vs "5 minutes ago") */
  abbreviated?: boolean;
}

/**
 * Format a timestamp to a human-readable relative time or date
 *
 * @param dateString - ISO date string or timestamp
 * @param options - Formatting options
 * @returns Human-readable relative time (e.g., "just now", "5 minutes ago", "Jan 15")
 *
 * @example
 * formatRelativeTime(new Date().toISOString()) // "just now"
 * formatRelativeTime(fiveMinutesAgo) // "5 minutes ago"
 * formatRelativeTime(fiveMinutesAgo, { abbreviated: true }) // "5m ago"
 */
export function formatRelativeTime(
  dateString: string | number,
  options: FormatRelativeTimeOptions = {}
): string {
  const { abbreviated = false } = options;

  const timestamp = typeof dateString === 'number'
    ? dateString
    : new Date(dateString).getTime();
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'just now';
  }

  if (minutes < 60) {
    if (abbreviated) {
      return `${minutes}m ago`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (hours < 24) {
    if (abbreviated) {
      return `${hours}h ago`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  if (days < 7) {
    if (abbreviated) {
      return `${days}d ago`;
    }
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  // For older dates, show the actual date
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format a date to a locale-specific string
 *
 * @param dateString - ISO date string or timestamp
 * @returns Formatted date string
 */
export function formatDate(dateString: string | number): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date and time to a locale-specific string
 *
 * @param dateString - ISO date string or timestamp
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string | number): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
