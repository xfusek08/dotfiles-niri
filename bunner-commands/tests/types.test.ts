import { describe, test, expect } from 'bun:test';
import { isNodeError, ConfigValidationError, withErrorContext } from '../lib/utils/types';

describe('types utilities', () => {
    describe('isNodeError', () => {
        test('should return true for Node.js ENOENT error', () => {
            const error = new Error('File not found') as NodeJS.ErrnoException;
            error.code = 'ENOENT';
            expect(isNodeError(error)).toBe(true);
        });

        test('should return true for Node.js EEXIST error', () => {
            const error = new Error('File exists') as NodeJS.ErrnoException;
            error.code = 'EEXIST';
            expect(isNodeError(error)).toBe(true);
        });

        test('should return false for regular Error', () => {
            const error = new Error('Regular error');
            expect(isNodeError(error)).toBe(false);
        });

        test('should return false for non-Error objects', () => {
            expect(isNodeError({})).toBe(false);
            expect(isNodeError({ code: 'ENOENT' })).toBe(false);
            expect(isNodeError('error string')).toBe(false);
        });

        test('should return false for null and undefined', () => {
            expect(isNodeError(null)).toBe(false);
            expect(isNodeError(undefined)).toBe(false);
        });

        test('should return false for Error with wrong code type', () => {
            const error = new Error('Test') as any;
            error.code = 123; // code should be string
            expect(isNodeError(error)).toBe(false); // code is not a string, should be false
        });

        test('should work with actual file system errors', async () => {
            try {
                const fs = await import('node:fs/promises');
                await fs.readFile('/non/existent/path/to/file.txt');
            } catch (error) {
                expect(isNodeError(error)).toBe(true);
                if (isNodeError(error)) {
                    expect(error.code).toBe('ENOENT');
                }
            }
        });
    });

    describe('ConfigValidationError', () => {
        test('should create error with field information', () => {
            const error = new ConfigValidationError('Invalid value', 'testField');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ConfigValidationError);
            expect(error.message).toBe('Invalid value');
            expect(error.field).toBe('testField');
            expect(error.name).toBe('ConfigValidationError');
        });

        test('should have correct prototype chain', () => {
            const error = new ConfigValidationError('Test message', 'field');
            expect(error instanceof Error).toBe(true);
            expect(error instanceof ConfigValidationError).toBe(true);
        });

        test('should preserve field property', () => {
            const error = new ConfigValidationError(
                'Missing required field',
                'paths.mainDirectory',
            );
            expect(error.field).toBe('paths.mainDirectory');
        });

        test('should be catchable and identifiable', () => {
            try {
                throw new ConfigValidationError('Invalid config', 'id');
            } catch (error) {
                expect(error).toBeInstanceOf(ConfigValidationError);
                if (error instanceof ConfigValidationError) {
                    expect(error.field).toBe('id');
                    expect(error.message).toBe('Invalid config');
                }
            }
        });

        test('should have stack trace', () => {
            const error = new ConfigValidationError('Test', 'field');
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('ConfigValidationError');
        });
    });

    describe('withErrorContext', () => {
        test('should execute successful operation and return result', async () => {
            const operation = async () => 'success result';
            const result = await withErrorContext(operation, 'Test operation');
            expect(result).toBe('success result');
        });

        test('should add context to Error instances', async () => {
            const operation = async () => {
                throw new Error('Original error');
            };

            await expect(withErrorContext(operation, 'Failed to process')).rejects.toThrow(
                'Failed to process: Original error',
            );
        });

        test('should handle string errors', async () => {
            const operation = async () => {
                throw 'string error';
            };

            await expect(withErrorContext(operation, 'Operation failed')).rejects.toThrow(
                'Operation failed: string error',
            );
        });

        test('should handle number errors', async () => {
            const operation = async () => {
                throw 42;
            };

            await expect(withErrorContext(operation, 'Number error')).rejects.toThrow(
                'Number error: 42',
            );
        });

        test('should handle null/undefined errors', async () => {
            const operation = async () => {
                throw null;
            };

            await expect(withErrorContext(operation, 'Null error')).rejects.toThrow(
                'Null error: null',
            );
        });

        test('should preserve original error as cause', async () => {
            const originalError = new Error('Original');
            const operation = async () => {
                throw originalError;
            };

            try {
                await withErrorContext(operation, 'Context');
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                if (error instanceof Error) {
                    expect(error.cause).toBe(originalError);
                }
            }
        });

        test('should work with synchronous errors in async operations', async () => {
            const operation = async () => {
                JSON.parse('invalid json');
            };

            await expect(withErrorContext(operation, 'JSON parsing failed')).rejects.toThrow(
                /JSON parsing failed:/,
            );
        });

        test('should handle complex nested operations', async () => {
            const operation = async () => {
                await withErrorContext(async () => {
                    throw new Error('Inner error');
                }, 'Inner context');
            };

            await expect(withErrorContext(operation, 'Outer context')).rejects.toThrow(
                'Outer context: Inner context: Inner error',
            );
        });

        test('should not modify successful return values', async () => {
            const complexResult = { data: [1, 2, 3], status: 'ok' };
            const operation = async () => complexResult;
            const result = await withErrorContext(operation, 'Test');
            expect(result).toEqual(complexResult);
            expect(result).toBe(complexResult); // Should be same reference
        });

        test('should work with operations returning undefined', async () => {
            const operation = async () => undefined;
            const result = await withErrorContext(operation, 'Test');
            expect(result).toBeUndefined();
        });

        test('should work with operations returning null', async () => {
            const operation = async () => null;
            const result = await withErrorContext(operation, 'Test');
            expect(result).toBeNull();
        });

        test('should include context in error message for ConfigValidationError', async () => {
            const operation = async () => {
                throw new ConfigValidationError('Invalid field', 'testField');
            };

            try {
                await withErrorContext(operation, 'Validation failed');
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                if (error instanceof Error) {
                    expect(error.message).toContain('Validation failed');
                    expect(error.message).toContain('Invalid field');
                }
            }
        });
    });
});
