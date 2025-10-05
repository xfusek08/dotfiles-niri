import { lstat } from 'node:fs/promises';

export default async function is_symlink(path: string): Promise<boolean> {
    try {
        const stats = await lstat(path);
        return stats.isSymbolicLink();
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}
