import { defineCommand, log } from 'bunner/framework';

import { tagSpacesConfig } from './lib/configs/tagspaces';
import { orchestrateInstallation } from './lib/utils/installationOrchestrator';

export default defineCommand({
    command: 'tagspaces-install',
    description: 'Installs TagSpaces using GitHub release AppImage.',
    action: async () => {
        log.info('Starting TagSpaces installation');

        const result = await orchestrateInstallation(tagSpacesConfig);

        if (result.success) {
            log.success('TagSpaces installation finished');
        } else {
            log.error('Installation failed');
            throw result.error;
        }
    },
});
