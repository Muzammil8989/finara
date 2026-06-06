/**
 * Date Utility Functions
 * Centralized date formatting and manipulation functions
 */

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string, locale: string = 'en-US'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date to a short format (e.g., "Jan 1")
 */
export function formatDateShort(dateString: string, locale: string = 'en-US'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date to show time (e.g., "3:45 PM")
 */
export function formatTime(dateString: string, locale: string = 'en-US'): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a date to show both date and time
 */
export function formatDateTime(dateString: string, locale: string = 'en-US'): string {
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get relative time description (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
  if (diffInHours > 0) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }
  if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }
  return 'Just now';
}

/**
 * Get start of day timestamp
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Get end of day timestamp
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Get start of month
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get ISO date string (YYYY-MM-DD)
 */
export function getISODateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the current month
 */
export function isCurrentMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}
