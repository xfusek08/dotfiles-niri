import { defineCommand, log } from 'bunner/framework';

import { zenBrowserConfig } from './lib/configs/zen_browser';
import { orchestrateInstallation } from './lib/utils/installationOrchestrator';

export default defineCommand({
    command: 'zen-browser-install',
    description: 'Installs the Zen Browser using GitHub release archives.',
    action: async () => {
        log.info('Starting Zen Browser installation');

        const result = await orchestrateInstallation(zenBrowserConfig);

        if (result.success) {
            log.success('Zen Browser installation finished');
        } else {
            log.error('Installation failed');
            throw result.error;
        }
    },
});
