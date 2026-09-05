/**
 * GSOC Decision Operations - Utils Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  now,
  formatDuration,
  minutesSince,
  isValidTimestamp,
  truncate,
  deepClone,
  sortByTimestamp,
  groupBy,
  countWhere,
} from '../utils.js';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should include prefix when provided', () => {
      const id = generateId('TEST');
      expect(id).toMatch(/^TEST_/);
    });

    it('should generate IDs without prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+_[a-z0-9]+$/);
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate IDs with timestamp component', () => {
      const id = generateId('PRE');
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('PRE');
    });
  });

  describe('now', () => {
    it('should return ISO timestamp', () => {
      const timestamp = now();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return valid parseable date', () => {
      const timestamp = now();
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T10:30:00Z';
      expect(formatDuration(start, end)).toBe('30 minutes');
    });

    it('should format hours and minutes', () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T12:45:00Z';
      expect(formatDuration(start, end)).toBe('2 hours 45 minutes');
    });

    it('should handle singular hour', () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T11:30:00Z';
      expect(formatDuration(start, end)).toBe('1 hour 30 minutes');
    });

    it('should handle singular minute', () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T10:01:00Z';
      expect(formatDuration(start, end)).toBe('1 minute');
    });

    it('should use current time if end not provided', () => {
      const start = new Date(Date.now() - 60000).toISOString();
      const result = formatDuration(start);
      expect(result).toMatch(/\d+ minute/);
    });
  });

  describe('minutesSince', () => {
    it('should calculate minutes since timestamp', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const minutes = minutesSince(tenMinutesAgo);
      expect(minutes).toBeGreaterThanOrEqual(10);
      expect(minutes).toBeLessThan(12);
    });

    it('should return 0 for current timestamp', () => {
      const current = new Date().toISOString();
      const minutes = minutesSince(current);
      expect(minutes).toBe(0);
    });
  });

  describe('isValidTimestamp', () => {
    it('should validate correct ISO timestamp', () => {
      expect(isValidTimestamp('2024-01-01T10:00:00Z')).toBe(true);
    });

    it('should validate timestamp with timezone', () => {
      expect(isValidTimestamp('2024-01-01T10:00:00+05:00')).toBe(true);
    });

    it('should reject invalid timestamp', () => {
      expect(isValidTimestamp('not-a-date')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidTimestamp('')).toBe(false);
    });

    it('should accept valid date string formats', () => {
      expect(isValidTimestamp('2024-01-01')).toBe(true);
      expect(isValidTimestamp('January 1, 2024')).toBe(true);
    });
  });

  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text with ellipsis', () => {
      const result = truncate('This is a very long text', 10);
      expect(result).toBe('This is...');
      expect(result.length).toBe(10);
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });
  });

  describe('deepClone', () => {
    it('should clone simple objects', () => {
      const original = { a: 1, b: 'test' };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested objects', () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.a).not.toBe(original.a);
      expect(cloned.a.b).not.toBe(original.a.b);
    });

    it('should clone arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('should not maintain references', () => {
      const original = { a: 1 };
      const cloned = deepClone(original);

      cloned.a = 2;
      expect(original.a).toBe(1);
    });
  });

  describe('sortByTimestamp', () => {
    const items = [
      { id: 1, timestamp: '2024-01-01T10:00:00Z' },
      { id: 2, timestamp: '2024-01-01T12:00:00Z' },
      { id: 3, timestamp: '2024-01-01T08:00:00Z' },
    ];

    it('should sort descending by default (newest first)', () => {
      const sorted = sortByTimestamp(items);

      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(1);
      expect(sorted[2].id).toBe(3);
    });

    it('should sort ascending when specified', () => {
      const sorted = sortByTimestamp(items, true);

      expect(sorted[0].id).toBe(3);
      expect(sorted[1].id).toBe(1);
      expect(sorted[2].id).toBe(2);
    });

    it('should not mutate original array', () => {
      const original = [...items];
      sortByTimestamp(items);

      expect(items).toEqual(original);
    });

    it('should handle empty array', () => {
      const sorted = sortByTimestamp([]);
      expect(sorted).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('should group items by key function', () => {
      const items = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ];

      const grouped = groupBy(items, (item) => item.type);

      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
      expect(grouped.A[0].value).toBe(1);
      expect(grouped.A[1].value).toBe(3);
    });

    it('should handle empty array', () => {
      const grouped = groupBy([], (item: { type: string }) => item.type);
      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it('should handle single item', () => {
      const items = [{ type: 'A', value: 1 }];
      const grouped = groupBy(items, (item) => item.type);

      expect(grouped.A).toHaveLength(1);
    });
  });

  describe('countWhere', () => {
    it('should count matching items', () => {
      const items = [1, 2, 3, 4, 5];
      const count = countWhere(items, (n) => n > 2);

      expect(count).toBe(3);
    });

    it('should return 0 for no matches', () => {
      const items = [1, 2, 3];
      const count = countWhere(items, (n) => n > 10);

      expect(count).toBe(0);
    });

    it('should return array length for all matches', () => {
      const items = [1, 2, 3];
      const count = countWhere(items, () => true);

      expect(count).toBe(3);
    });

    it('should handle empty array', () => {
      const count = countWhere([], () => true);
      expect(count).toBe(0);
    });

    it('should work with object predicates', () => {
      const items = [
        { active: true },
        { active: false },
        { active: true },
      ];
      const count = countWhere(items, (item) => item.active);

      expect(count).toBe(2);
    });
  });
});
