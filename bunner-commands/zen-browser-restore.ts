import { defineCommand, log } from 'bunner/framework';

import { restore } from './lib/app_manager';
import { zen_browser_config } from './lib/configs/zen_browser';

export default defineCommand({
    command: 'zen-browser-restore',
    description: 'Restore Zen Browser from backup',
    options: [] as const,
    action: async ({ args }) => {
        const [backup_file] = args.popFirstArg();

        if (!backup_file) {
            log.error('Backup file path is required as an argument');
            log.info('Usage: zen-browser-restore <backup-file>');
            process.exit(1);
        }

        log.info('Starting Zen Browser restore');
        await restore({
            config: zen_browser_config,
            backup_file,
        });
        log.success('Zen Browser restored successfully');
    },
});
