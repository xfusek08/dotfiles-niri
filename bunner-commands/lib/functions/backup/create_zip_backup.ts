import { rename, rm } from 'node:fs/promises';

import create_temporary_file from '../create_temporary_file';
import path_exists from '../path_exists';
import { ProcessRunner } from 'bunner/modules/process/ProcessRunner';

export type CreateZipBackupOptions = {
    source_directory: string;
    destination_file: string;
    exclude_patterns?: string[];
};

export default async function create_zip_backup({
    source_directory,
    destination_file,
    exclude_patterns,
}: CreateZipBackupOptions): Promise<string> {
    const temporaryBackupPath = (
        await create_temporary_file('backup.XXXXXX.zip').text()
    ).trim();

    const command = ['zip', '-qr', temporaryBackupPath, '.'];

    if (exclude_patterns && exclude_patterns.length > 0) {
        for (const pattern of exclude_patterns) {
            command.push('-x', pattern);
        }
    }

    try {
        await ProcessRunner.run({
            cmd: command,
            spawnOptions: {
                cwd: source_directory,
            },
        });
    } catch (error) {
        await rm(temporaryBackupPath, { force: true }).catch(() => {});
        throw error;
    }

    if (await path_exists(destination_file)) {
        await rm(destination_file, { force: true });
    }

    await rename(temporaryBackupPath, destination_file);
    return destination_file;
}
