import { $ } from 'bunner/framework';

const TMP_DIR = process.env.TMPDIR ?? '/tmp';

/**
 * Creates a temporary directory with the given pattern.
 * @param pattern - The pattern for the temporary directory name (e.g., 'extract.XXXXXX')
 * @returns The absolute path to the created temporary directory
 * @throws Error if the directory creation fails
 */
export default async function create_temporary_directory(pattern: string): Promise<string> {
    try {
        const result = await $`mktemp -d ${TMP_DIR}/${pattern}`.text();
        const path = result.trim();

        if (!path) {
            throw new Error('mktemp returned empty path');
        }

        return path;
    } catch (error) {
        const error_message = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to create temporary directory with pattern "${pattern}": ${error_message}`,
        );
    }
}
