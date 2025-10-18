import * as fs from 'node:fs/promises';
import is_directory from './is_directory';

export default async function ensure_directory(directory_path: string) {
    if (await is_directory(directory_path)) {
        return;
    }

    await fs.mkdir(directory_path, { recursive: true });

    if (!(await is_directory(directory_path))) {
        throw new Error(
            `Failed to ensure directory (path exists but is not a directory): ${directory_path}`,
        );
    }
}
