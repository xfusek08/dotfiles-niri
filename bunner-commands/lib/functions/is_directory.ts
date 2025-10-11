import { stat } from 'node:fs/promises';

export default async function is_directory(path: string): Promise<boolean> {
    try {
        const res = await stat(path);
        return res.isDirectory();
    } catch {
        return false;
    }
}
