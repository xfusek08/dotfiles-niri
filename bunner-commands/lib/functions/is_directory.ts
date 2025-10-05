import { stat } from 'node:fs/promises';

export default async function is_directory(path: string): Promise<boolean> {
    const stats = await stat(path).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    });

    if (!stats) {
        return false;
    }

    return stats.isDirectory();
}
