import { $ } from 'bunner/framework';

const TMP_DIR = process.env.TMPDIR ?? '/tmp';

/**
 * Creates a temporary file with the given pattern.
 * @param pattern - The pattern for the temporary file name (e.g., 'archive.XXXXXX.tar.gz')
 * @returns The absolute path to the created temporary file
 * @throws Error if the file creation fails
 */
export default async function create_temporary_file(pattern: string): Promise<string> {
    try {
        const result = await $`mktemp -p ${TMP_DIR} ${pattern}`.text();
        const path = result.trim();

        if (!path) {
            throw new Error('mktemp returned empty path');
        }

        return path;
    } catch (error) {
        const error_message = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to create temporary file with pattern "${pattern}": ${error_message}`,
        );
    }
}
