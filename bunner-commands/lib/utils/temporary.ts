import { $ } from 'bunner/framework';

const TMP_DIR = process.env.TMPDIR ?? '/tmp';

/**
 * Creates a temporary directory with the given pattern.
 *
 * @param pattern - The pattern for the temporary directory name (e.g., 'extract.XXXXXX')
 * @returns The absolute path to the created temporary directory
 * @throws Error if the directory creation fails
 */
export async function createTemporaryDirectory(pattern: string): Promise<string> {
    try {
        const result = await $`mktemp -d ${TMP_DIR}/${pattern}`.text();
        const path = result.trim();

        if (!path) {
            throw new Error('mktemp returned empty path');
        }

        return path;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to create temporary directory with pattern "${pattern}": ${errorMessage}`,
        );
    }
}

/**
 * Creates a temporary file with the given pattern.
 *
 * @param pattern - The pattern for the temporary file name (e.g., 'archive.XXXXXX.tar.gz')
 * @returns The absolute path to the created temporary file
 * @throws Error if the file creation fails
 */
export async function createTemporaryFile(pattern: string): Promise<string> {
    try {
        const result = await $`mktemp -p ${TMP_DIR} ${pattern}`.text();
        const path = result.trim();

        if (!path) {
            throw new Error('mktemp returned empty path');
        }

        return path;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to create temporary file with pattern "${pattern}": ${errorMessage}`,
        );
    }
}
