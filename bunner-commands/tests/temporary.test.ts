import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createTemporaryDirectory, createTemporaryFile } from '../lib/utils/temporary';
import { isDirectory } from '../lib/utils/fileSystem';
import { rm, access } from 'node:fs/promises';
import { constants } from 'node:fs';

describe('temporary', () => {
    const createdPaths: string[] = [];

    afterEach(async () => {
        // Clean up all created temporary files/directories
        for (const path of createdPaths) {
            try {
                await rm(path, { recursive: true, force: true });
            } catch {
                // Ignore cleanup errors
            }
        }
        createdPaths.length = 0;
    });

    describe('createTemporaryDirectory', () => {
        test('should create a temporary directory', async () => {
            const tempDir = await createTemporaryDirectory('test.XXXXXX');
            createdPaths.push(tempDir);

            const exists = await isDirectory(tempDir);
            expect(exists).toBe(true);
        });

        test('should create directory with custom pattern', async () => {
            const tempDir = await createTemporaryDirectory('myapp.XXXXXX');
            createdPaths.push(tempDir);

            const exists = await isDirectory(tempDir);
            expect(exists).toBe(true);
            expect(tempDir).toContain('myapp.');
        });

        test('should create unique directories', async () => {
            const dir1 = await createTemporaryDirectory('test.XXXXXX');
            const dir2 = await createTemporaryDirectory('test.XXXXXX');
            createdPaths.push(dir1, dir2);

            expect(dir1).not.toBe(dir2);
            expect(await isDirectory(dir1)).toBe(true);
            expect(await isDirectory(dir2)).toBe(true);
        });

        test('should create directory in system temp location', async () => {
            const tempDir = await createTemporaryDirectory('test.XXXXXX');
            createdPaths.push(tempDir);
            expect(tempDir).toMatch(/^\/tmp\//);
        });

        test('should create accessible directory', async () => {
            const tempDir = await createTemporaryDirectory('test.XXXXXX');
            createdPaths.push(tempDir);

            // Check if we can access the directory - access() throws if not accessible
            await access(tempDir, constants.R_OK | constants.W_OK | constants.X_OK);
            // If we reach here, the directory is accessible
            expect(tempDir).toBeTruthy();
        });

        test('should handle different patterns', async () => {
            const dir1 = await createTemporaryDirectory('prefix1.XXXXXX');
            const dir2 = await createTemporaryDirectory('prefix2.XXXXXX');
            createdPaths.push(dir1, dir2);

            expect(dir1).toContain('prefix1.');
            expect(dir2).toContain('prefix2.');
            expect(dir1).not.toContain('prefix2.');
            expect(dir2).not.toContain('prefix1.');
        });

        test('should work with simple pattern', async () => {
            const tempDir = await createTemporaryDirectory('tmp.XXXXXX');
            createdPaths.push(tempDir);

            expect(await isDirectory(tempDir)).toBe(true);
        });

        test('should return valid path string', async () => {
            const tempDir = await createTemporaryDirectory('test.XXXXXX');
            createdPaths.push(tempDir);
            expect(typeof tempDir).toBe('string');
            expect(tempDir.length).toBeGreaterThan(0);
        });
    });

    describe('createTemporaryFile', () => {
        test('should create a temporary file', async () => {
            const tempFile = await createTemporaryFile('test.XXXXXX');
            createdPaths.push(tempFile);

            // Check if file exists - access() throws if not accessible
            await access(tempFile, constants.F_OK);
            expect(tempFile).toBeTruthy();
        });

        test('should create file with custom pattern', async () => {
            const tempFile = await createTemporaryFile('myfile.XXXXXX');
            createdPaths.push(tempFile);

            await access(tempFile, constants.F_OK);
            expect(tempFile).toContain('myfile.');
        });

        test('should create file with extension in pattern', async () => {
            const tempFile = await createTemporaryFile('test.XXXXXX.txt');
            createdPaths.push(tempFile);

            await access(tempFile, constants.F_OK);
            expect(tempFile).toEndWith('.txt');
        });

        test('should create file with complex pattern', async () => {
            const tempFile = await createTemporaryFile('archive.XXXXXX.tar.gz');
            createdPaths.push(tempFile);

            await access(tempFile, constants.F_OK);
            expect(tempFile).toContain('archive.');
            expect(tempFile).toEndWith('.tar.gz');
        });

        test('should create unique files', async () => {
            const file1 = await createTemporaryFile('test.XXXXXX');
            const file2 = await createTemporaryFile('test.XXXXXX');
            createdPaths.push(file1, file2);

            expect(file1).not.toBe(file2);
            await access(file1, constants.F_OK);
            await access(file2, constants.F_OK);
        });

        test('should create file in system temp location', async () => {
            const tempFile = await createTemporaryFile('test.XXXXXX');
            createdPaths.push(tempFile);

            // On Linux, temp files are typically in /tmp
            expect(tempFile).toMatch(/^\/tmp\//);
        });

        test('should create readable and writable file', async () => {
            const tempFile = await createTemporaryFile('test.XXXXXX');
            createdPaths.push(tempFile);

            // Check if we can read and write to the file
            await access(tempFile, constants.R_OK | constants.W_OK);
            expect(tempFile).toBeTruthy();
        });

        test('should not create a directory', async () => {
            const tempFile = await createTemporaryFile('test.XXXXXX');
            createdPaths.push(tempFile);

            expect(await isDirectory(tempFile)).toBe(false);
        });

        test('should handle various extensions in pattern', async () => {
            const patterns = [
                'test.XXXXXX.txt',
                'test.XXXXXX.json',
                'test.XXXXXX.zip',
                'archive.XXXXXX.tar.gz',
                'log.XXXXXX.log',
            ];
            const files: string[] = [];

            for (const pattern of patterns) {
                const file = await createTemporaryFile(pattern);
                files.push(file);
                createdPaths.push(file);
                // Extract expected extension from pattern (everything after first dot)
                const expectedExt = pattern.substring(
                    pattern.indexOf('.', pattern.indexOf('XXXXXX')),
                );
                if (expectedExt && expectedExt !== '.XXXXXX') {
                    expect(file).toContain('.');
                }
            }

            // Verify all are unique
            const uniqueFiles = new Set(files);
            expect(uniqueFiles.size).toBe(patterns.length);
        });

        test('should handle simple pattern', async () => {
            const tempFile = await createTemporaryFile('tmp.XXXXXX');
            createdPaths.push(tempFile);

            await access(tempFile, constants.F_OK);
            expect(tempFile).toBeTruthy();
        });
    });

    describe('integration', () => {
        test('should allow creating file in temporary directory', async () => {
            const tempDir = await createTemporaryDirectory('test.XXXXXX');
            createdPaths.push(tempDir);

            // Note: createTemporaryFile creates in system temp, not in our temp dir
            // This test verifies the directory is usable for manual file operations
            const testFilePath = `${tempDir}/test-file.txt`;
            await Bun.write(testFilePath, 'test content');

            await access(testFilePath, constants.F_OK);
            expect(testFilePath).toBeTruthy();
        });

        test('should create multiple temp resources independently', async () => {
            const dir1 = await createTemporaryDirectory('dir.XXXXXX');
            const dir2 = await createTemporaryDirectory('dir.XXXXXX');
            const file1 = await createTemporaryFile('file.XXXXXX.txt');
            const file2 = await createTemporaryFile('file.XXXXXX.txt');
            createdPaths.push(dir1, dir2, file1, file2);

            // All should be unique
            const allPaths = new Set([dir1, dir2, file1, file2]);
            expect(allPaths.size).toBe(4);

            // All should exist
            expect(await isDirectory(dir1)).toBe(true);
            expect(await isDirectory(dir2)).toBe(true);
            await access(file1, constants.F_OK);
            await access(file2, constants.F_OK);
        });
    });
});
