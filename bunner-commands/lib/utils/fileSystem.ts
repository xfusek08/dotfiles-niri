import { stat, mkdir, readdir } from 'node:fs/promises';
import { $ } from 'bunner/framework';

/**
 * Checks if a path exists and is a directory.
 *
 * @param path - The path to check
 * @returns True if path exists and is a directory, false otherwise
 */
export async function isDirectory(path: string): Promise<boolean> {
    try {
        const res = await stat(path);
        return res.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Reads directory entries (filenames only).
 *
 * @param directoryPath - The directory path to read
 * @returns Array of entry names, or empty array if directory doesn't exist/can't be read
 */
export async function readDirectoryEntries(directoryPath: string): Promise<string[]> {
    try {
        return await readdir(directoryPath);
    } catch {
        return [];
    }
}

/**
 * Checks if a directory exists and contains at least one entry.
 *
 * @param directoryPath - The directory path to check
 * @returns True if directory exists and has entries, false otherwise
 */
export async function isDirectoryNonEmpty(directoryPath: string): Promise<boolean> {
    const entries = await readDirectoryEntries(directoryPath);
    return entries.length > 0;
}

/**
 * Ensures a directory exists, creating it recursively if needed.
 * Throws an error if the path exists but is not a directory.
 *
 * @param directoryPath - The directory path to ensure
 * @throws Error if path exists but is not a directory
 */
export async function ensureDirectory(directoryPath: string): Promise<void> {
    if (await isDirectory(directoryPath)) {
        return;
    }

    await mkdir(directoryPath, { recursive: true });

    if (!(await isDirectory(directoryPath))) {
        throw new Error(
            `Failed to ensure directory (path exists but is not a directory): ${directoryPath}`,
        );
    }
}

/**
 * Recursively deletes a file or directory.
 * Uses `rm -rf` for reliable deletion.
 *
 * @param path - The path to delete
 */
export async function deleteRecursively(path: string): Promise<void> {
    await $`rm -rf ${path}`;
}
