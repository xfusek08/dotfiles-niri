/**
 * Generates a timestamp string suitable for backup filenames.
 * Format: YYYY:MM:DD:HH:MM:SS
 *
 * @param date - The date to format (defaults to current date/time)
 * @returns Formatted timestamp string
 *
 * @example
 * ```typescript
 * generateBackupTimestamp(new Date('2025-10-18T14:30:45'))
 * // Returns: "2025:10:18:14:30:45"
 * ```
 */
export function generateBackupTimestamp(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}:${month}:${day}:${hours}:${minutes}:${seconds}`;
}
