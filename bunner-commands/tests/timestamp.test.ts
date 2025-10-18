import { describe, test, expect } from 'bun:test';
import { generateBackupTimestamp } from '../lib/utils/timestamp';

describe('timestamp utilities', () => {
    describe('generateBackupTimestamp', () => {
        test('should generate timestamp in correct format YYYY:MM:DD:HH:MM:SS', () => {
            const date = new Date('2025-10-18T14:30:45');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:10:18:14:30:45');
        });

        test('should pad single digit month with zero', () => {
            const date = new Date('2025-03-05T08:15:30');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:03:05:08:15:30');
        });

        test('should pad single digit day with zero', () => {
            const date = new Date('2025-12-01T18:45:00');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:12:01:18:45:00');
        });

        test('should pad single digit hour with zero', () => {
            const date = new Date('2025-06-15T03:22:10');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:06:15:03:22:10');
        });

        test('should pad single digit minute with zero', () => {
            const date = new Date('2025-09-20T12:05:55');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:09:20:12:05:55');
        });

        test('should pad single digit second with zero', () => {
            const date = new Date('2025-08-25T16:30:03');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:08:25:16:30:03');
        });

        test('should use current time when no date provided', () => {
            const before = new Date();
            const result = generateBackupTimestamp();
            const after = new Date();

            // Parse the generated timestamp
            const [datePart, timePart] = result.split(':');
            const year = parseInt(result.substring(0, 4));
            const month = parseInt(result.substring(5, 7));
            const day = parseInt(result.substring(8, 10));

            // Verify it's a valid timestamp format
            expect(result).toMatch(/^\d{4}:\d{2}:\d{2}:\d{2}:\d{2}:\d{2}$/);

            // Verify the date is reasonable (between before and after)
            expect(year).toBeGreaterThanOrEqual(before.getFullYear());
            expect(year).toBeLessThanOrEqual(after.getFullYear());
            expect(month).toBeGreaterThanOrEqual(1);
            expect(month).toBeLessThanOrEqual(12);
            expect(day).toBeGreaterThanOrEqual(1);
            expect(day).toBeLessThanOrEqual(31);
        });

        test('should handle midnight correctly', () => {
            const date = new Date('2025-01-01T00:00:00');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:01:01:00:00:00');
        });

        test('should handle end of day correctly', () => {
            const date = new Date('2025-12-31T23:59:59');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2025:12:31:23:59:59');
        });

        test('should handle leap year date', () => {
            const date = new Date('2024-02-29T12:00:00');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2024:02:29:12:00:00');
        });

        test('should be consistent across multiple calls with same date', () => {
            const date = new Date('2025-07-15T10:20:30');
            const result1 = generateBackupTimestamp(date);
            const result2 = generateBackupTimestamp(date);
            expect(result1).toBe(result2);
        });

        test('should generate different timestamps for different dates', () => {
            const date1 = new Date('2025-01-01T00:00:00');
            const date2 = new Date('2025-12-31T23:59:59');
            const result1 = generateBackupTimestamp(date1);
            const result2 = generateBackupTimestamp(date2);
            expect(result1).not.toBe(result2);
        });

        test('should handle dates far in the past', () => {
            const date = new Date('2000-01-01T00:00:00');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2000:01:01:00:00:00');
        });

        test('should handle dates in the future', () => {
            const date = new Date('2099-12-31T23:59:59');
            const result = generateBackupTimestamp(date);
            expect(result).toBe('2099:12:31:23:59:59');
        });

        test('generated timestamps should be sortable lexicographically', () => {
            const date1 = new Date('2025-01-15T10:30:00');
            const date2 = new Date('2025-03-20T14:45:30');
            const date3 = new Date('2025-12-31T23:59:59');

            const ts1 = generateBackupTimestamp(date1);
            const ts2 = generateBackupTimestamp(date2);
            const ts3 = generateBackupTimestamp(date3);

            const sorted = [ts3, ts1, ts2].sort();
            expect(sorted).toEqual([ts1, ts2, ts3]);
        });

        test('should use colons as separators (not hyphens)', () => {
            const date = new Date('2025-10-18T14:30:45');
            const result = generateBackupTimestamp(date);
            expect(result.split(':').length).toBe(6); // Should have 5 colons creating 6 parts
            expect(result).not.toContain('-');
        });
    });
});
