import { defineCommand, log } from 'bunner/framework';

import { uninstall } from './lib/app_manager';
import { zen_browser_config } from './lib/configs/zen_browser';

export default defineCommand({
    command: 'zen-browser-uninstall',
    description: 'Uninstall Zen Browser',
    options: [] as const,
    action: async () => {
        log.info('Starting Zen Browser uninstallation');
        await uninstall({ config: zen_browser_config });
        log.success('Zen Browser uninstalled successfully');
    },
});
