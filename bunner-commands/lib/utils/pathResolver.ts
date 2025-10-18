import { canonicalizePath, resolvePath } from './path';

/**
 * Centralized path resolver with optional caching.
 * Resolves paths with environment variable expansion and symlink resolution.
 */
export class PathResolver {
    private cache: Map<string, string> = new Map();

    /**
     * Resolves a single path with environment variable expansion.
     * Optionally caches the result for repeated lookups.
     *
     * @param path - Path to resolve (may contain ~ or environment variables)
     * @param options - Resolution options
     * @param options.cache - Whether to cache the resolved path
     * @param options.canonicalize - Whether to canonicalize (follow symlinks) or just expand variables
     * @returns Resolved absolute path
     */
    async resolve(
        path: string,
        options?: { cache?: boolean; canonicalize?: boolean },
    ): Promise<string> {
        const shouldCanonicalize = options?.canonicalize ?? true;
        const cacheKey = `${path}:${shouldCanonicalize}`;

        if (options?.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const resolved = shouldCanonicalize
            ? await canonicalizePath(path)
            : await resolvePath(path);

        if (options?.cache) {
            this.cache.set(cacheKey, resolved);
        }

        return resolved;
    }

    /**
     * Resolves multiple paths in parallel.
     *
     * @param paths - Array of paths to resolve
     * @param options - Resolution options
     * @returns Array of resolved absolute paths
     */
    async resolveAll(
        paths: string[],
        options?: { cache?: boolean; canonicalize?: boolean },
    ): Promise<string[]> {
        return Promise.all(paths.map((p) => this.resolve(p, options)));
    }

    /**
     * Clears the path resolution cache.
     */
    clearCache(): void {
        this.cache.clear();
    }
}
