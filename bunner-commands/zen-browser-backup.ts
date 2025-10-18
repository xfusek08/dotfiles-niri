import { defineCommand, log } from 'bunner/framework';

import { backup } from './lib/app_manager';
import { zen_browser_config } from './lib/configs/zen_browser';

export default defineCommand({
    command: 'zen-browser-backup',
    description: 'Create a backup of Zen Browser installation',
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
        log.info('Starting Zen Browser backup');
        const backup_file = await backup({
            config: zen_browser_config,
            backup_name: options.name,
            use_timestamp: options.timestamp,
            backup_all: options.all,
            custom_backup_dir: options['backup-dir'],
        });
        log.success(`Backup created: ${backup_file}`);
    },
});
