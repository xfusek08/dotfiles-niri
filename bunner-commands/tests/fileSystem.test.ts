import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
    isDirectory,
    readDirectoryEntries,
    isDirectoryNonEmpty,
    ensureDirectory,
    deleteRecursively,
} from '../lib/utils/fileSystem';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('fileSystem utilities', () => {
    const testBaseDir = join(tmpdir(), 'filesystem-test-' + Date.now());

    beforeEach(async () => {
        // Clean up before each test
        if (existsSync(testBaseDir)) {
            await deleteRecursively(testBaseDir);
        }
    });

    afterEach(async () => {
        // Clean up after each test
        if (existsSync(testBaseDir)) {
            await deleteRecursively(testBaseDir);
        }
    });

    describe('isDirectory', () => {
        test('should return true for existing directory', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            const result = await isDirectory(testBaseDir);
            expect(result).toBe(true);
        });

        test('should return false for non-existent path', async () => {
            const result = await isDirectory(join(testBaseDir, 'non-existent'));
            expect(result).toBe(false);
        });

        test('should return false for file (not directory)', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            const filePath = join(testBaseDir, 'test.txt');
            writeFileSync(filePath, 'test');
            const result = await isDirectory(filePath);
            expect(result).toBe(false);
        });

        test('should return true for system directories', async () => {
            const result = await isDirectory('/tmp');
            expect(result).toBe(true);
        });
    });

    describe('readDirectoryEntries', () => {
        test('should return empty array for non-existent directory', async () => {
            const result = await readDirectoryEntries(join(testBaseDir, 'non-existent'));
            expect(result).toEqual([]);
        });

        test('should return entries for directory with files', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            writeFileSync(join(testBaseDir, 'file1.txt'), 'content1');
            writeFileSync(join(testBaseDir, 'file2.txt'), 'content2');
            mkdirSync(join(testBaseDir, 'subdir'));

            const result = await readDirectoryEntries(testBaseDir);
            expect(result).toHaveLength(3);
            expect(result).toContain('file1.txt');
            expect(result).toContain('file2.txt');
            expect(result).toContain('subdir');
        });

        test('should return empty array for empty directory', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            const result = await readDirectoryEntries(testBaseDir);
            expect(result).toEqual([]);
        });

        test('should not include . and .. entries', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            writeFileSync(join(testBaseDir, 'test.txt'), 'test');
            const result = await readDirectoryEntries(testBaseDir);
            expect(result).not.toContain('.');
            expect(result).not.toContain('..');
        });
    });

    describe('isDirectoryNonEmpty', () => {
        test('should return false for empty directory', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            const result = await isDirectoryNonEmpty(testBaseDir);
            expect(result).toBe(false);
        });

        test('should return true for directory with files', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            writeFileSync(join(testBaseDir, 'file.txt'), 'content');
            const result = await isDirectoryNonEmpty(testBaseDir);
            expect(result).toBe(true);
        });

        test('should return true for directory with subdirectories', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            mkdirSync(join(testBaseDir, 'subdir'));
            const result = await isDirectoryNonEmpty(testBaseDir);
            expect(result).toBe(true);
        });

        test('should return false for non-existent directory', async () => {
            const result = await isDirectoryNonEmpty(join(testBaseDir, 'non-existent'));
            expect(result).toBe(false);
        });

        test('should return true for directory with hidden files', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            writeFileSync(join(testBaseDir, '.hidden'), 'content');
            const result = await isDirectoryNonEmpty(testBaseDir);
            expect(result).toBe(true);
        });
    });

    describe('ensureDirectory', () => {
        test('should create directory if it does not exist', async () => {
            const dirPath = join(testBaseDir, 'new-dir');
            await ensureDirectory(dirPath);
            expect(existsSync(dirPath)).toBe(true);
            const isDir = await isDirectory(dirPath);
            expect(isDir).toBe(true);
        });

        test('should create nested directories recursively', async () => {
            const dirPath = join(testBaseDir, 'level1', 'level2', 'level3');
            await ensureDirectory(dirPath);
            expect(existsSync(dirPath)).toBe(true);
            const isDir = await isDirectory(dirPath);
            expect(isDir).toBe(true);
        });

        test('should not fail if directory already exists', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            await ensureDirectory(testBaseDir);
            expect(existsSync(testBaseDir)).toBe(true);
        });

        test('should throw error if path exists but is not a directory', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            const filePath = join(testBaseDir, 'file.txt');
            writeFileSync(filePath, 'content');

            await expect(ensureDirectory(filePath)).rejects.toThrow();
        });
        test('should preserve existing directory content', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            const filePath = join(testBaseDir, 'existing.txt');
            writeFileSync(filePath, 'content');

            await ensureDirectory(testBaseDir);
            expect(existsSync(filePath)).toBe(true);
        });
    });

    describe('deleteRecursively', () => {
        test('should delete empty directory', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            await deleteRecursively(testBaseDir);
            expect(existsSync(testBaseDir)).toBe(false);
        });

        test('should delete directory with files', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            writeFileSync(join(testBaseDir, 'file1.txt'), 'content1');
            writeFileSync(join(testBaseDir, 'file2.txt'), 'content2');

            await deleteRecursively(testBaseDir);
            expect(existsSync(testBaseDir)).toBe(false);
        });

        test('should delete nested directories', async () => {
            const nestedPath = join(testBaseDir, 'level1', 'level2', 'level3');
            mkdirSync(nestedPath, { recursive: true });
            writeFileSync(join(nestedPath, 'file.txt'), 'content');

            await deleteRecursively(testBaseDir);
            expect(existsSync(testBaseDir)).toBe(false);
        });

        test('should delete single file', async () => {
            mkdirSync(testBaseDir, { recursive: true });
            const filePath = join(testBaseDir, 'file.txt');
            writeFileSync(filePath, 'content');

            await deleteRecursively(filePath);
            expect(existsSync(filePath)).toBe(false);
        });

        test('should not fail if path does not exist', async () => {
            const nonExistent = join(testBaseDir, 'non-existent');
            // deleteRecursively returns void, so just verify it doesn't throw
            await deleteRecursively(nonExistent);
            expect(true).toBe(true); // If we reach here, no error was thrown
        });

        test('should handle paths with special characters', async () => {
            const specialDir = join(testBaseDir, 'dir with spaces & special!chars');
            mkdirSync(specialDir, { recursive: true });
            writeFileSync(join(specialDir, 'file.txt'), 'content');

            await deleteRecursively(specialDir);
            expect(existsSync(specialDir)).toBe(false);
        });
    });
});
