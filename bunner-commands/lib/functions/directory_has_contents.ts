import { readdir } from 'node:fs/promises';

export default async function directory_has_contents(path: string): Promise<boolean> {
    try {
        const entries = await readdir(path);
        return entries.length > 0;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}
