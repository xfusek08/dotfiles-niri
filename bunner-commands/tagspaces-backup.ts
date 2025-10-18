import { defineCommand, log } from 'bunner/framework';

import { backup } from './lib/utils/app_manager';
import { tagSpacesConfig } from './lib/configs/tagspaces';

export default defineCommand({
    command: 'tagspaces-backup',
    description: 'Create a backup of TagSpaces installation',
    options: [
        {
            short: 'n',
            long: 'name',
            type: 'string',
            required: false,
            description: 'Custom backup name',
        },
        {
            short: 't',
            long: 'timestamp',
            type: 'boolean',
            description: 'Add timestamp to backup name',
        },
        {
            short: 'a',
            long: 'all',
            type: 'boolean',
            description: 'Backup all files (no exclusions)',
        },
        {
            short: 'f',
            long: 'backup-dir',
            type: 'string',
            required: false,
            description: 'Custom backup directory',
        },
    ] as const,
    action: async ({ options }) => {
        log.info('Starting TagSpaces backup');
        const backupFile = await backup({
            config: tagSpacesConfig,
            backupName: options.name,
            useTimestamp: options.timestamp,
            backupAll: options.all,
            customBackupDir: options['backup-dir'],
        });
        log.success(`Backup created: ${backupFile}`);
    },
});
