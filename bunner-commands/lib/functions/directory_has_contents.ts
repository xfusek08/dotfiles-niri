import { readdir } from 'node:fs/promises';

export default async function directory_has_contents(
    path: string,
): Promise<boolean> {
    const entries = await readdir(path);
    return entries.length > 0;
}
