import { defineCommand, log } from 'bunner/framework';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { extractArchive } from './lib/utils/archive';
import { ensureDirectory, deleteRecursively, isDirectory } from './lib/utils/fileSystem';
import { canonicalizePath } from './lib/utils/path';

async function findLatestBackup(backupDir: string, appName: string): Promise<string | null> {
    if (!(await isDirectory(backupDir))) {
        return null;
    }

    const entries = await readdir(backupDir, { withFileTypes: true });
    const backupFiles = entries
        .filter(
            (entry) =>
                entry.isFile() &&
                entry.name.startsWith(`${appName}-`) &&
                entry.name.endsWith('.zip'),
        )
        .map((entry) => ({
            name: entry.name,
            path: join(backupDir, entry.name),
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort descending (latest first)

    return backupFiles.length > 0 ? backupFiles[0].path : null;
}

export default defineCommand({
    command: 'tagspaces-restore',
    description: 'Restore TagSpaces from the latest backup',
    options: [
        {
            short: 'b',
            long: 'backup',
            type: 'string',
            required: false,
            description: 'Specific backup file to restore (otherwise uses latest)',
        },
    ] as const,
    action: async ({ options }) => {
        log.info('Starting TagSpaces restore');

        // Import here to avoid circular dependency
        const { resolveAppImagePaths } = await import('./lib/utils/appimage');
        const paths = await resolveAppImagePaths('tagspaces');

        let backupFile: string;

        if (options.backup) {
            backupFile = await canonicalizePath(options.backup);
        } else {
            const latestBackup = await findLatestBackup(paths.backupDir, 'tagspaces');
            if (!latestBackup) {
                log.error(`No backup found in ${paths.backupDir}`);
                log.info('Backups are automatically created during installation.');
                process.exit(1);
            }
            backupFile = latestBackup;
        }

        log.info(`Restoring from ${backupFile} to ${paths.appDir}`);

        // Clear existing installation
        await deleteRecursively(paths.appDir);
        await ensureDirectory(paths.appDir);

        // Extract backup
        await extractArchive({
            archivePath: backupFile,
            outputDirectory: paths.appDir,
        });

        log.success('TagSpaces restored successfully');
    },
});
