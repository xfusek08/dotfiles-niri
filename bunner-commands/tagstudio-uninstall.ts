import { defineCommand, log } from 'bunner/framework';

import { uninstall } from './lib/utils/app_manager';
import { tagStudioConfig } from './lib/configs/tagstudio';

export default defineCommand({
    command: 'tagstudio-uninstall',
    description: 'Uninstall TagStudio',
    options: [] as const,
    action: async () => {
        log.info('Starting TagStudio uninstallation');
        await uninstall({ config: tagStudioConfig });
        log.success('TagStudio uninstalled successfully');
    },
});
