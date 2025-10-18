import { defineCommand, log } from 'bunner/framework';

import { uninstall } from './lib/utils/app_manager';
import { tagSpacesConfig } from './lib/configs/tagspaces';

export default defineCommand({
    command: 'tagspaces-uninstall',
    description: 'Uninstall TagSpaces',
    options: [] as const,
    action: async () => {
        log.info('Starting TagSpaces uninstallation');
        await uninstall({ config: tagSpacesConfig });
        log.success('TagSpaces uninstalled successfully');
    },
});
