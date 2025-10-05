import { $ } from 'bun';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import path_exists from './path_exists';

export type ListBackupFilesOptions = {
    directory: string;
    extension?: string;
    recursive?: boolean;
};

export default async function list_backup_files({
    directory,
    extension = '.zip',
    recursive = true,
}: ListBackupFilesOptions): Promise<string[]> {
    if (!(await path_exists(directory))) {
        return [];
    }

    const normalized_extension = extension.startsWith('.') ? extension : `.${extension}`;
    const pattern = normalized_extension.length > 0 ? `*${normalized_extension}` : '*';

    if (!recursive) {
        const entries = await readdir(directory);
        return entries
            .filter((entry) => entry.endsWith(normalized_extension))
            .map((entry) => join(directory, entry));
    }

    const output = await $`find ${directory} -type f -name ${pattern}`.text();
    return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}
