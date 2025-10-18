import { defineCommand, log } from 'bunner/framework';

import { restore } from './lib/utils/app_manager';
import { zenBrowserConfig } from './lib/configs/zen_browser';

export default defineCommand({
    command: 'zen-browser-restore',
    description: 'Restore Zen Browser from backup',
    options: [] as const,
    action: async ({ args }) => {
        const [backupFile] = args.popFirstArg();

        if (!backupFile) {
            log.error('Backup file path is required as an argument');
            log.info('Usage: zen-browser-restore <backup-file>');
            process.exit(1);
        }

        log.info('Starting Zen Browser restore');
        await restore({
            config: zenBrowserConfig,
            backupFile,
        });
        log.success('Zen Browser restored successfully');
    },
});
