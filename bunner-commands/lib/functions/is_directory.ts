import { stat } from 'node:fs/promises';

export default async function is_directory(path: string) {
    let res = await stat(path);
    return res.isDirectory();
}
