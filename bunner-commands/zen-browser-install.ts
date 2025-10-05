import { defineCommand, log } from 'bunner/framework';

import { install } from './lib/app_manager';
import { zen_browser_config } from './lib/configs/zen_browser';

export default defineCommand({
    command: 'zen-browser-install',
    description: 'Installs the Zen Browser using GitHub release archives.',
    action: async () => {
        log.info('Starting Zen Browser installation');
        await install({ config: zen_browser_config });
        log.success('Zen Browser installation finished');
    },
});
