import { describe, test, expect } from 'bun:test';
import { detectArchiveType } from '../lib/utils/archive';
import type { ArchiveType } from '../lib/utils/archive';

describe('archive', () => {
    describe('detectArchiveType', () => {
        test('should detect tar.gz archive', () => {
            const result = detectArchiveType('file.tar.gz');
            expect(result).toBe('tar.gz' as ArchiveType);
        });

        test('should detect tar.xz archive', () => {
            const result = detectArchiveType('file.tar.xz');
            expect(result).toBe('tar.xz' as ArchiveType);
        });

        test('should detect zip archive', () => {
            const result = detectArchiveType('file.zip');
            expect(result).toBe('zip' as ArchiveType);
        });

        test('should detect tar.gz with complex filename', () => {
            const result = detectArchiveType('my-app-v1.2.3-linux-x86_64.tar.gz');
            expect(result).toBe('tar.gz' as ArchiveType);
        });

        test('should detect tar.xz with complex filename', () => {
            const result = detectArchiveType('application-2023-12-01-release.tar.xz');
            expect(result).toBe('tar.xz' as ArchiveType);
        });

        test('should detect zip with complex filename', () => {
            const result = detectArchiveType('MyApp_v2.0_Final.zip');
            expect(result).toBe('zip' as ArchiveType);
        });

        test('should be case insensitive for tar.gz', () => {
            const result = detectArchiveType('FILE.TAR.GZ');
            expect(result).toBe('tar.gz' as ArchiveType);
        });

        test('should be case insensitive for tar.xz', () => {
            const result = detectArchiveType('FILE.TAR.XZ');
            expect(result).toBe('tar.xz' as ArchiveType);
        });

        test('should be case insensitive for zip', () => {
            const result = detectArchiveType('FILE.ZIP');
            expect(result).toBe('zip' as ArchiveType);
        });

        test('should be case insensitive with mixed case', () => {
            const result = detectArchiveType('file.Tar.Gz');
            expect(result).toBe('tar.gz' as ArchiveType);
        });

        test('should handle path with directories', () => {
            const result = detectArchiveType('/path/to/archive/file.tar.gz');
            expect(result).toBe('tar.gz' as ArchiveType);
        });

        test('should throw for unknown extension', () => {
            expect(() => detectArchiveType('file.rar')).toThrow();
            expect(() => detectArchiveType('file.rar')).toThrow(/Could not detect archive type/);
        });

        test('should throw for file without extension', () => {
            expect(() => detectArchiveType('file')).toThrow();
            expect(() => detectArchiveType('file')).toThrow(/Could not detect archive type/);
        });

        test('should throw for single extension that is not tar', () => {
            expect(() => detectArchiveType('file.gz')).toThrow();
        });

        test('should throw for .tar without compression', () => {
            expect(() => detectArchiveType('file.tar')).toThrow();
            expect(() => detectArchiveType('file.tar')).toThrow(/Could not detect archive type/);
        });

        test('should throw for empty string', () => {
            expect(() => detectArchiveType('')).toThrow();
        });

        test('should throw for whitespace only', () => {
            expect(() => detectArchiveType('   ')).toThrow();
        });

        test('should handle filename with dots before extension', () => {
            const result = detectArchiveType('my.app.version.1.2.3.tar.gz');
            expect(result).toBe('tar.gz' as ArchiveType);
        });

        test('should handle URL-like paths', () => {
            const result = detectArchiveType('https://example.com/downloads/app.tar.gz');
            expect(result).toBe('tar.gz' as ArchiveType);
        });

        test('should handle Windows-style paths', () => {
            const result = detectArchiveType('C:\\Users\\Downloads\\app.zip');
            expect(result).toBe('zip' as ArchiveType);
        });
    });

    // Note: Tests for createZipArchive, extractArchive, downloadFile, and downloadAndExtractArchive
    // would require either:
    // 1. Integration tests with actual files and shell commands
    // 2. Mocking the Bun.$ shell command execution
    // 3. Testing in a controlled environment with test fixtures
    //
    // These are more complex to test in a unit test environment and may be better suited
    // for integration tests or end-to-end tests. The functions interact with:
    // - File system operations
    // - Shell commands (tar, zip, curl, mktemp)
    // - External network requests (for downloadFile)
    //
    // Consider adding integration tests separately if needed.
});
