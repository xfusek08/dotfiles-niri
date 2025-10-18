import { defineCommand, log } from 'bunner/framework';

import { restore } from './lib/utils/app_manager';
import { tagSpacesConfig } from './lib/configs/tagspaces';

export default defineCommand({
    command: 'tagspaces-restore',
    description: 'Restore TagSpaces from backup',
    options: [] as const,
    action: async ({ args }) => {
        const [backupFile] = args.popFirstArg();

        if (!backupFile) {
            log.error('Backup file path is required as an argument');
            log.info('Usage: tagspaces-restore <backup-file>');
            process.exit(1);
        }

        log.info('Starting TagSpaces restore');
        await restore({
            config: tagSpacesConfig,
            backupFile,
        });
        log.success('TagSpaces restored successfully');
    },
});
