import { isAbsolute, join } from 'node:path';

import path_exists from './path_exists';
import list_backup_files from './list_backup_files';

export type ResolveRestoreFileOptions = {
    provided_path?: string | null;
    backup_directory: string;
    extension?: string;
};

export type ResolveRestoreFileResult =
    | { status: 'found'; file_path: string }
    | {
          status: 'not-found';
          requested_path?: string;
          available_backups: string[];
          reason: 'missing' | 'not-specified' | 'no-backups';
      };

export default async function resolve_restore_file({
    provided_path,
    backup_directory,
    extension = '.zip',
}: ResolveRestoreFileOptions): Promise<ResolveRestoreFileResult> {
    const trimmed = provided_path?.trim();

    if (trimmed && trimmed.length > 0) {
        const candidates = [trimmed];

        if (!isAbsolute(trimmed)) {
            candidates.push(join(backup_directory, trimmed));
        }

        for (const candidate of candidates) {
            if (await path_exists(candidate)) {
                return { status: 'found', file_path: candidate };
            }
        }
        const available_backups = await list_backup_files({
            directory: backup_directory,
            extension,
        });

        return {
            status: 'not-found',
            requested_path: trimmed,
            available_backups,
            reason: available_backups.length === 0 ? 'no-backups' : 'missing',
        };
    }

    const available_backups = await list_backup_files({
        directory: backup_directory,
        extension,
    });

    return {
        status: 'not-found',
        available_backups,
        reason: available_backups.length === 0 ? 'no-backups' : 'not-specified',
    };
}
