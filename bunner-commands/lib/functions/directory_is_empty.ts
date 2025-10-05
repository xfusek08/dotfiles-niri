import { readdir } from 'node:fs/promises';

export default async function directory_is_empty(
    path: string,
): Promise<boolean> {
    try {
        const entries = await readdir(path);
        return entries.length === 0;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return true;
        }
        throw error;
    }
}
