import { isAbsolute, join } from 'node:path';

import path_exists from '../path_exists';
import list_backup_files from './list_backup_files';

export type ResolveRestoreFileOptions = {
    providedPath?: string | null;
    backupDirectory: string;
    extension?: string;
};

export type ResolveRestoreFileResult =
    | { status: 'found'; filePath: string }
    | {
          status: 'not-found';
          requestedPath?: string;
          availableBackups: string[];
          reason: 'missing' | 'not-specified' | 'no-backups';
      };

export default async function resolve_restore_file({
    providedPath,
    backupDirectory,
    extension = '.zip',
}: ResolveRestoreFileOptions): Promise<ResolveRestoreFileResult> {
    const trimmed = providedPath?.trim();

    if (trimmed && trimmed.length > 0) {
        const candidates = [trimmed];

        if (!isAbsolute(trimmed)) {
            candidates.push(join(backupDirectory, trimmed));
        }

        for (const candidate of candidates) {
            if (await path_exists(candidate)) {
                return { status: 'found', filePath: candidate };
            }
        }
        const availableBackups = await list_backup_files({
            directory: backupDirectory,
            extension,
        });

        return {
            status: 'not-found',
            requestedPath: trimmed,
            availableBackups,
            reason: availableBackups.length === 0 ? 'no-backups' : 'missing',
        };
    }

    const availableBackups = await list_backup_files({
        directory: backupDirectory,
        extension,
    });

    return {
        status: 'not-found',
        availableBackups,
        reason: availableBackups.length === 0 ? 'no-backups' : 'not-specified',
    };
}
