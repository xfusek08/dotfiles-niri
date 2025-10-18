import { $ } from 'bun';

/**
 * Resolves a path with environment variable expansion but preserves symlinks.
 * Useful for paths that should preserve symlinks (like executable links in desktop files).
 * @param value - Path string that may contain ~ or environment variables
 * @returns Resolved path with variables expanded
 * @throws TypeError if value is not a valid string
 * @throws Error if path expansion fails
 */
export async function resolve_path(value: string): Promise<string> {
    // Validate input
    if (!value || typeof value !== 'string') {
        throw new TypeError('Path must be a non-empty string');
    }

    // Expand environment variables and ~ but don't canonicalize
    // Useful for paths that should preserve symlinks (like executable links in desktop files)
    const result = await $`echo ${value}`.text();
    const trimmed = result.trim();

    if (!trimmed) {
        throw new Error(`Failed to resolve path: "${value}"`);
    }

    return trimmed;
}

/**
 * Expands environment variables AND canonicalizes to real absolute path.
 * Follows symlinks and resolves to actual file locations.
 * @param value - Path string that may contain ~ or environment variables
 * @returns Canonicalized absolute path
 * @throws TypeError if value is not a valid string
 * @throws Error if path canonicalization fails
 */
export async function canonicalize_path(value: string): Promise<string> {
    // Validate input
    if (!value || typeof value !== 'string') {
        throw new TypeError('Path must be a non-empty string');
    }

    // Expand environment variables AND canonicalize to real absolute path
    // Follows symlinks and resolves to actual file locations
    // The -m flag allows paths that don't exist yet
    const result = await $`realpath -m ${value}`.text();
    const trimmed = result.trim();

    if (!trimmed) {
        throw new Error(`Failed to canonicalize path: "${value}"`);
    }

    return trimmed;
}
