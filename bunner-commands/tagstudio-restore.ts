import { defineCommand, log } from 'bunner/framework';

import { restore } from './lib/utils/app_manager';
import { tagStudioConfig } from './lib/configs/tagstudio';

export default defineCommand({
    command: 'tagstudio-restore',
    description: 'Restore TagStudio from backup',
    options: [] as const,
    action: async ({ args }) => {
        const [backupFile] = args.popFirstArg();

        if (!backupFile) {
            log.error('Backup file path is required as an argument');
            log.info('Usage: tagstudio-restore <backup-file>');
            process.exit(1);
        }

        log.info('Starting TagStudio restore');
        await restore({
            config: tagStudioConfig,
            backupFile,
        });
        log.success('TagStudio restored successfully');
    },
});
