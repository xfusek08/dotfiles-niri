import { rename, rm } from 'node:fs/promises';

import create_temporary_file from '../create_temporary_file';
import path_exists from '../path_exists';
import { ProcessRunner } from 'bunner/modules/process/ProcessRunner';

export type CreateZipBackupOptions = {
    sourceDirectory: string;
    destinationFile: string;
    excludePatterns?: string[];
};

export default async function create_zip_backup({
    sourceDirectory,
    destinationFile,
    excludePatterns,
}: CreateZipBackupOptions): Promise<string> {
    const temporaryBackupPath = (
        await create_temporary_file('backup.XXXXXX.zip').text()
    ).trim();

    const command = ['zip', '-qr', temporaryBackupPath, '.'];

    if (excludePatterns && excludePatterns.length > 0) {
        for (const pattern of excludePatterns) {
            command.push('-x', pattern);
        }
    }

    try {
        await ProcessRunner.run({
            cmd: command,
            spawnOptions: {
                cwd: sourceDirectory,
            },
        });
    } catch (error) {
        await rm(temporaryBackupPath, { force: true }).catch(() => {});
        throw error;
    }

    if (await path_exists(destinationFile)) {
        await rm(destinationFile, { force: true });
    }

    await rename(temporaryBackupPath, destinationFile);
    return destinationFile;
}
