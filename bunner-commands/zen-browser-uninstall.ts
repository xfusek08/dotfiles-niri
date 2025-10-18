import { defineCommand, log } from 'bunner/framework';

import { uninstall } from './lib/utils/app_manager';
import { zenBrowserConfig } from './lib/configs/zen_browser';

export default defineCommand({
    command: 'zen-browser-uninstall',
    description: 'Uninstall Zen Browser',
    options: [] as const,
    action: async () => {
        log.info('Starting Zen Browser uninstallation');
        await uninstall({ config: zenBrowserConfig });
        log.success('Zen Browser uninstalled successfully');
    },
});
