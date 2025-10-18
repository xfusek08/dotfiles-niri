import { defineCommand, log } from 'bunner/framework';

import { backup, install, restore } from './lib/app_manager';
import { zen_browser_config } from './lib/configs/zen_browser';
import delete_recursively from './lib/functions/delete_recursively';
import ensure_directory from './lib/functions/ensure_directory';
import { is_directory_non_empty } from './lib/functions/is_directory_non_empty';
import { canonicalize_path } from './lib/functions/realpath';

/**
 * Handles backup and cleanup of an existing installation.
 * @returns The path to the backup file, or null if no backup was created
 */
async function handle_existing_installation(install_directory: string): Promise<string | null> {
    if (!(await is_directory_non_empty(install_directory))) {
        log.info(`No existing installation found at ${install_directory}`);
        return null;
    }

    log.info(`Existing installation detected at ${install_directory}`);
    const backup_file = await backup({
        config: zen_browser_config,
        backup_name: zen_browser_config.backup.pre_install_backup_name,
        use_timestamp: true,
    });

    // Clear the installation directory
    await delete_recursively(install_directory);
    await ensure_directory(install_directory);

    return backup_file;
}

/**
 * Attempts to restore from backup if installation fails.
 */
async function rollback_on_failure(
    backup_file: string | null,
    install_directory: string,
): Promise<void> {
    if (!backup_file) {
        return;
    }

    log.error('Installation failed, attempting to restore from backup');
    try {
        await delete_recursively(install_directory);
        await restore({ config: zen_browser_config, backup_file });
        log.success(`Successfully restored from backup: ${backup_file}`);
    } catch (restore_error) {
        const error_message =
            restore_error instanceof Error ? restore_error.message : String(restore_error);
        log.error(`Failed to restore from backup: ${error_message}`);
    }
}

export default defineCommand({
    command: 'zen-browser-install',
    description: 'Installs the Zen Browser using GitHub release archives.',
    action: async () => {
        log.info('Starting Zen Browser installation');

        const install_directory = await canonicalize_path(
            zen_browser_config.paths.install_directory,
        );

        const backup_file = await handle_existing_installation(install_directory);

        try {
            // Attempt installation
            await install({ config: zen_browser_config });
            log.success('Zen Browser installation finished');
        } catch (error) {
            await rollback_on_failure(backup_file, install_directory);
            // Re-throw the original error
            throw error;
        }
    },
});
