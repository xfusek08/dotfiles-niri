import { defineCommand, log } from 'bunner/framework';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

import resolve_backup_destination from './lib/functions/backup/resolve_backup_destination';
import resolve_restore_file from './lib/functions/backup/resolve_restore_file';
import restore_backup_archive from './lib/functions/backup/restore_backup_archive';
import create_zip_backup from './lib/functions/backup/create_zip_backup';
import ensure_directory from './lib/functions/ensure_directory';

const DEFAULT_BACKUP_NAME = 'zen-browser-backup';

export default defineCommand({
    command: 'zen-browser-backup',
    description: 'Create or restore Zen Browser configuration backups.',
    options: [
        {
            short: 'r',
            long: 'restore',
            type: 'boolean',
            description:
                'Restore from an existing backup instead of creating one.',
        },
        {
            short: 'a',
            long: 'all',
            type: 'boolean',
            description: 'Include all files (no exclusions) in the backup.',
        },
        {
            short: 'f',
            long: 'file-dir',
            type: 'path',
            required: false,
            description:
                'Directory where the backup file will be stored or searched.',
        },
        {
            short: 'n',
            long: 'name',
            type: 'string',
            required: false,
            description: 'Custom base name for the backup file.',
        },
        {
            short: 't',
            long: 'timestamp',
            type: 'boolean',
            description:
                'Append a timestamp to the generated backup file name.',
        },
    ] as const,
    action: async ({ args, options }) => {
        const homeDirectory = process.env.HOME ?? homedir();
        const mainDirectory = join(homeDirectory, '.zen');

        const suffixes: string[] = [];
        if (options.all) {
            suffixes.push('complete');
        }

        const { directory: backupDirectory, filePath: backupFilePath } =
            await resolve_backup_destination({
                baseName:
                    options.name && options.name.length > 0
                        ? options.name
                        : DEFAULT_BACKUP_NAME,
                customDirectory: options['file-dir'],
                environmentVariable: 'SYNCED_BACKUP_DIR',
                suffixes,
                includeTimestamp: options.timestamp,
            });

        if (options.restore) {
            const restoreResult = await resolve_restore_file({
                providedPath: args.getString(0),
                backupDirectory,
            });

            if (restoreResult.status === 'found') {
                log.info(
                    `Restoring Zen Browser from ${restoreResult.filePath} to ${mainDirectory}`,
                );
                await restore_backup_archive({
                    archivePath: restoreResult.filePath,
                    targetDirectory: mainDirectory,
                });
                log.success('Restore completed');
                console.log(restoreResult.filePath);
                return;
            }

            const { availableBackups, requestedPath, reason } = restoreResult;

            if (requestedPath) {
                log.error(`No backup file found at ${requestedPath}`);
            }

            if (availableBackups.length > 0) {
                log.info(`Available backups in ${backupDirectory}:`);
                for (const backup of availableBackups) {
                    log.info(`  ${basename(backup)}`);
                }
                log.info(
                    'Use `zen-browser-backup -r <file>` to restore a specific backup.',
                );
            } else if (reason === 'no-backups') {
                log.error(
                    'No backup files found. Create a backup before attempting a restore.',
                );
            }

            if (reason === 'missing') {
                throw new Error(
                    `Cannot restore because backup file ${requestedPath} does not exist.`,
                );
            }

            if (reason === 'no-backups') {
                throw new Error('No backup files available to restore.');
            }

            throw new Error('No backup file specified for restore.');
        }

        await ensure_directory(mainDirectory);

        const excludePatterns = options.all
            ? undefined
            : ['zen/*', '*.tar.gz', '*.zip', '*/storage/**'];

        log.info(`Creating backup from ${mainDirectory}`);
        const createdBackup = await create_zip_backup({
            sourceDirectory: mainDirectory,
            destinationFile: backupFilePath,
            excludePatterns,
        });

        log.success(`Backup created at ${createdBackup}`);
        console.log(createdBackup);
    },
});
