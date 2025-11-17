import { defineCommand, log } from 'bunner/framework';

import { uninstallAppImage } from './lib/utils/appimage';

export default defineCommand({
    command: 'tagspaces-uninstall',
    description: 'Uninstall TagSpaces',
    options: [] as const,
    action: async () => {
        log.info('Starting TagSpaces uninstallation');
        await uninstallAppImage({ appName: 'tagspaces' });
        log.success('TagSpaces uninstalled successfully');
    },
});
