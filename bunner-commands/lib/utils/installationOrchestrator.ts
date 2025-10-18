import { log } from 'bunner/framework';
import { AppConfig, backup, install, restore } from './app_manager';
import { canonicalizePath } from './path';
import { deleteRecursively, ensureDirectory, isDirectoryNonEmpty } from './fileSystem';

export type InstallationResult = {
    success: boolean;
    backupFile?: string;
    error?: Error;
};

/**
 * Handles backup and cleanup of an existing installation.
 * @returns The path to the backup file, or null if no backup was created
 */
async function handleExistingInstallation(
    config: AppConfig,
    installDirectory: string,
): Promise<string | null> {
    if (!(await isDirectoryNonEmpty(installDirectory))) {
        log.info(`No existing installation found at ${installDirectory}`);
        return null;
    }

    log.info(`Existing installation detected at ${installDirectory}`);
    const backupFile = await backup({
        config,
        backupName: config.backup.preInstallBackupName,
        useTimestamp: true,
    });

    // Clear the installation directory
    await deleteRecursively(installDirectory);
    await ensureDirectory(installDirectory);

    return backupFile;
}

/**
 * Attempts to restore from backup if installation fails.
 */
async function rollbackOnFailure(
    config: AppConfig,
    backupFile: string | null,
    installDirectory: string,
): Promise<void> {
    if (!backupFile) {
        return;
    }

    log.error('Installation failed, attempting to restore from backup');
    try {
        await deleteRecursively(installDirectory);
        await restore({ config, backupFile });
        log.success(`Successfully restored from backup: ${backupFile}`);
    } catch (restoreError) {
        const errorMessage =
            restoreError instanceof Error ? restoreError.message : String(restoreError);
        log.error(`Failed to restore from backup: ${errorMessage}`);
    }
}

/**
 * Orchestrates the installation process including backup, installation, and rollback.
 *
 * @param config - Application configuration
 * @returns Installation result with success status, optional backup file, and error if failed
 */
export async function orchestrateInstallation(config: AppConfig): Promise<InstallationResult> {
    const installDirectory = await canonicalizePath(config.paths.installDirectory);
    let backupFile: string | null = null;

    try {
        backupFile = await handleExistingInstallation(config, installDirectory);
        await install({ config });
        return { success: true, backupFile: backupFile ?? undefined };
    } catch (error) {
        await rollbackOnFailure(config, backupFile, installDirectory);
        return {
            success: false,
            backupFile: backupFile ?? undefined,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
}
