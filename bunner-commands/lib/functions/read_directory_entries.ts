import { readdir } from 'fs/promises';

export async function read_directory_entries(directory_path: string): Promise<string[]> {
    try {
        return await readdir(directory_path);
    } catch {
        return [];
    }
}
