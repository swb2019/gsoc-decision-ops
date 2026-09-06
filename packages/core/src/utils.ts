/**
 * GSOC Decision Operations - Utility Functions
 *
 * Helper functions for ID generation, timestamps, and validation.
 */

/**
 * Generate a unique identifier with optional prefix
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Format duration between two timestamps
 */
export function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Calculate minutes elapsed since a timestamp
 */
export function minutesSince(timestamp: string): number {
  const then = new Date(timestamp);
  const diffMs = Date.now() - then.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Validate ISO timestamp format
 */
export function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sort array by timestamp field (newest first)
 */
export function sortByTimestamp<T extends { timestamp: string }>(
  items: T[],
  ascending: boolean = false
): T[] {
  return [...items].sort((a, b) => {
    const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    return ascending ? diff : -diff;
  });
}

/**
 * Group items by a key function
 */
export function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Count items matching a predicate
 */
export function countWhere<T>(items: T[], predicate: (item: T) => boolean): number {
  return items.filter(predicate).length;
}

/**
 * Slugify a title for VO file naming
 *
 * Converts a title to a URL-safe slug matching CoS naming convention:
 * - Lowercase
 * - Non-alphanumeric characters → "-"
 * - Trim leading/trailing dashes
 * - Collapse multiple consecutive dashes
 * - Max 80 characters
 *
 * Example: "FLASH: CEO Dark Web Mention" → "flash-ceo-dark-web-mention"
 */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
