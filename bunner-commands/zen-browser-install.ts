import { defineCommand, log } from 'bunner/framework';

import { backup, install, restore } from './lib/app_manager';
import { zen_browser_config } from './lib/configs/zen_browser';
import delete_recursively from './lib/functions/delete_recursively';
import ensure_directory from './lib/functions/ensure_directory';
import { is_directory_non_empty } from 'lib/functions/is_directory_non_empty';
import { canonicalize_path } from 'lib/functions/realpath';

export default defineCommand({
    command: 'zen-browser-install',
    description: 'Installs the Zen Browser using GitHub release archives.',
    action: async () => {
        log.info('Starting Zen Browser installation');

        const install_directory = await canonicalize_path(
            zen_browser_config.paths.install_directory,
        );
        let backup_file: string | null = null;

        // Check if existing installation exists and create backup
        if (await is_directory_non_empty(install_directory)) {
            log.info(`Existing installation detected at ${install_directory}`);
            backup_file = await backup({
                config: zen_browser_config,
                backup_name: zen_browser_config.backup.pre_install_backup_name,
                use_timestamp: true,
            });

            // Clear the installation directory
            await delete_recursively(install_directory);
            await ensure_directory(install_directory);
        } else {
            log.info(`No existing installation found at ${install_directory}`);
        }

        try {
            // Attempt installation
            await install({ config: zen_browser_config });
            log.success('Zen Browser installation finished');
        } catch (error) {
            // If installation failed and we have a backup, restore it
            if (backup_file) {
                log.error(
                    `Installation failed, attempting to restore from backup`,
                );
                try {
                    await delete_recursively(install_directory);
                    await restore({ config: zen_browser_config, backup_file });
                    log.success(
                        `Successfully restored from backup: ${backup_file}`,
                    );
                } catch (restore_error) {
                    log.error(
                        `Failed to restore from backup: ${restore_error}`,
                    );
                }
            }
            // Re-throw the original error
            throw error;
        }
    },
});
