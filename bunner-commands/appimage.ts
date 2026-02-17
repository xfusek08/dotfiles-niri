import { defineCommand, log } from 'bunner/framework';

import { installAppImage, uninstallAppImage } from './lib/utils/appimage';

export default defineCommand({
    command: 'appimage',
    description: 'Manage AppImage applications with desktop integration',
    options: [
        {
            short: 'i',
            long: 'install',
            type: 'string',
            description: 'Install an AppImage application (provide app name)',
            required: false,
        },
        {
            short: 'u',
            long: 'uninstall',
            type: 'string',
            description: 'Uninstall an AppImage application (provide app name)',
            required: false,
        },
        {
            short: 's',
            long: 'source',
            type: 'path',
            required: false,
            description: 'AppImage source - URL or local file path (required for install)',
        },
    ] as const,
    action: async ({ options }) => {
        // Validate mutually exclusive operations
        if (options.install && options.uninstall) {
            log.error('Cannot specify both --install and --uninstall');
            process.exit(1);
        }

        if (options.install) {
            // Install operation
            if (!options.source) {
                log.error('AppImage source is required for installation (use -s or --source)');
                process.exit(1);
            }

            log.info(`Installing AppImage: ${options.install}`);
            await installAppImage({
                appName: options.install,
                appImageSource: options.source,
            });
        } else if (options.uninstall) {
            // Uninstall operation
            log.info(`Uninstalling AppImage: ${options.uninstall}`);
            await uninstallAppImage({
                appName: options.uninstall,
            });
        } else {
            log.error('No operation specified. Use --install or --uninstall.');
            process.exit(1);
        }
    },
});
