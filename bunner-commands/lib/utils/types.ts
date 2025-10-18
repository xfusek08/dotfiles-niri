/**
 * Type guard to check if an error is a Node.js system error.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error && typeof (error as any).code === 'string';
}

/**
 * Error thrown when application configuration validation fails.
 */
export class ConfigValidationError extends Error {
    constructor(
        message: string,
        public readonly field: string,
    ) {
        super(message);
        this.name = 'ConfigValidationError';
    }
}

/**
 * Wraps an async operation with error context for better error messages.
 *
 * @param operation - The async operation to execute
 * @param context - Context description to prepend to error messages
 * @returns The result of the operation
 * @throws Error with added context if operation fails
 */
export async function withErrorContext<T>(
    operation: () => Promise<T>,
    context: string,
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${context}: ${message}`, { cause: error });
    }
}
