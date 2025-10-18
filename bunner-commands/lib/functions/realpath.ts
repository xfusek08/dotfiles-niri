import { $ } from 'bun';

export async function resolve_path(value: string): Promise<string> {
    // Expand environment variables and ~ but don't canonicalize
    // Useful for paths that should preserve symlinks (like executable links in desktop files)
    const result = await $`sh -c 'echo '"${value}"''`.text();
    return result.trim();
}

export async function canonicalize_path(value: string): Promise<string> {
    // Expand environment variables AND canonicalize to real absolute path
    // Follows symlinks and resolves to actual file locations
    // The -m flag allows paths that don't exist yet
    const result = await $`sh -c 'realpath -m '"${value}"''`.text();
    return result.trim();
}
