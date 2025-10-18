import { read_directory_entries } from 'lib/functions/read_directory_entries';

export async function is_directory_non_empty(directory_path: string): Promise<boolean> {
    const entries = await read_directory_entries(directory_path);
    return entries.length > 0;
}
