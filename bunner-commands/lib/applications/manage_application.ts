import { rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname } from 'node:path';

import { log } from 'bunner/framework';

import attempt_restore_installation from '../functions/attempt_restore_installation';
import create_zip_backup from '../functions/backup/create_zip_backup';
import resolve_backup_destination from '../functions/backup/resolve_backup_destination';
import resolve_restore_file from '../functions/backup/resolve_restore_file';
import restore_backup_archive from '../functions/backup/restore_backup_archive';
import delete_recursively from '../functions/delete_recursively';
import directory_is_empty from '../functions/directory_is_empty';
import ensure_directory from '../functions/ensure_directory';
import install_release_from_github from '../functions/install_release_from_github';
import is_directory from '../functions/is_directory';
import is_symlink from '../functions/is_symlink';
import path_exists from '../functions/path_exists';
import prepare_installation_directory from '../functions/prepare_installation_directory';
import register_executable_link from '../functions/register_executable_link';
import setup_desktop_entry from '../functions/setup_desktop_entry';
import type { ApplicationDefinition, ApplicationPaths } from './types';

export type ApplicationCommandMode =
    | 'install'
    | 'backup'
    | 'restore'
    | 'uninstall';

export type ApplicationCommandParameters = {
    mode: ApplicationCommandMode;
    includeAll?: boolean;
    includeTimestamp?: boolean;
    customName?: string;
    customDirectory?: string;
    restoreFile?: string | null;
};

type BackupExecutionResult = {
    filePath: string;
    directory: string;
};

type BackupOptions = {
    includeAll: boolean;
    includeTimestamp: boolean;
    customName?: string;
    customDirectory?: string;
    emitConsoleOutput: boolean;
};

type RestoreOptions = {
    includeAll: boolean;
    includeTimestamp: boolean;
    customName?: string;
    customDirectory?: string;
    providedPath?: string | null;
    emitConsoleOutput: boolean;
};

export async function manageApplication(
    definition: ApplicationDefinition,
    parameters: ApplicationCommandParameters,
): Promise<void> {
    const homeDirectory = process.env.HOME ?? homedir();
    const paths = definition.resolvePaths(homeDirectory);

    switch (parameters.mode) {
        case 'backup':
            await executeBackup(definition, paths, {
                includeAll: parameters.includeAll ?? false,
                includeTimestamp: parameters.includeTimestamp ?? false,
                customName: parameters.customName,
                customDirectory: parameters.customDirectory,
                emitConsoleOutput: true,
            });
            return;
        case 'restore':
            await executeRestore(definition, paths, {
                includeAll: parameters.includeAll ?? false,
                includeTimestamp: parameters.includeTimestamp ?? false,
                customName: parameters.customName,
                customDirectory: parameters.customDirectory,
                providedPath: parameters.restoreFile,
                emitConsoleOutput: true,
            });
            return;
        case 'install':
            await executeInstall(definition, paths, {
                includeAll: parameters.includeAll ?? false,
                customName: parameters.customName,
                customDirectory: parameters.customDirectory,
            });
            return;
        case 'uninstall':
            await executeUninstall(definition, paths);
            return;
        default:
            throw new Error('Unknown command mode');
    }
}

async function executeBackup(
    definition: ApplicationDefinition,
    paths: ApplicationPaths,
    options: BackupOptions,
): Promise<BackupExecutionResult> {
    await ensure_directory(paths.mainDirectory);

    const fallbackDirectory = definition.backup.fallbackDirectory
        ? definition.backup.fallbackDirectory(paths)
        : undefined;

    const suffixes: string[] = [];
    if (options.includeAll && definition.backup.includeAllSuffix) {
        suffixes.push(definition.backup.includeAllSuffix);
    }

    const { filePath, directory } = await resolve_backup_destination({
        baseName:
            options.customName && options.customName.length > 0
                ? options.customName
                : definition.backup.defaultBaseName,
        customDirectory: options.customDirectory,
        fallbackDirectory,
        environmentVariable: definition.backup.environmentVariable,
        suffixes,
        includeTimestamp: options.includeTimestamp,
    });

    const excludePatterns = options.includeAll
        ? undefined
        : definition.backup.excludePatterns;

    log.info(`Creating backup from ${paths.mainDirectory}`);
    const createdBackup = await create_zip_backup({
        sourceDirectory: paths.mainDirectory,
        destinationFile: filePath,
        excludePatterns,
    });

    log.success(`Backup created at ${createdBackup}`);
    if (options.emitConsoleOutput) {
        console.log(createdBackup);
    }

    return { filePath: createdBackup, directory };
}

async function executeRestore(
    definition: ApplicationDefinition,
    paths: ApplicationPaths,
    options: RestoreOptions,
): Promise<string> {
    await ensure_directory(paths.mainDirectory);

    const fallbackDirectory = definition.backup.fallbackDirectory
        ? definition.backup.fallbackDirectory(paths)
        : undefined;

    const { directory: backupDirectory } = await resolve_backup_destination({
        baseName:
            options.customName && options.customName.length > 0
                ? options.customName
                : definition.backup.defaultBaseName,
        customDirectory: options.customDirectory,
        fallbackDirectory,
        environmentVariable: definition.backup.environmentVariable,
        suffixes: [],
        includeTimestamp: options.includeTimestamp,
    });

    const restoreResult = await resolve_restore_file({
        providedPath: options.providedPath,
        backupDirectory,
    });

    if (restoreResult.status === 'found') {
        log.info(
            `Restoring ${definition.name} from ${restoreResult.filePath} to ${paths.mainDirectory}`,
        );
        await restore_backup_archive({
            archivePath: restoreResult.filePath,
            targetDirectory: paths.mainDirectory,
        });
        log.success('Restore completed');
        if (options.emitConsoleOutput) {
            console.log(restoreResult.filePath);
        }
        return restoreResult.filePath;
    }

    const { availableBackups, requestedPath, reason } = restoreResult;

    if (requestedPath) {
        log.error(`No backup file found at ${requestedPath}`);
    }

    if (availableBackups.length > 0) {
        log.info(`Available backups in ${backupDirectory}:`);
        for (const backup of availableBackups) {
            log.info(`  ${basename(backup)}`);
        }
        log.info(
            `Use \`${definition.id} --restore <file>\` to restore a specific backup.`,
        );
    } else if (reason === 'no-backups') {
        log.error(
            'No backup files found. Create a backup before attempting a restore.',
        );
    }

    if (reason === 'missing') {
        throw new Error(
            `Cannot restore because backup file ${requestedPath} does not exist.`,
        );
    }

    if (reason === 'no-backups') {
        throw new Error('No backup files available to restore.');
    }

    throw new Error('No backup file specified for restore.');
}

type InstallOptions = {
    includeAll: boolean;
    customName?: string;
    customDirectory?: string;
};

async function executeInstall(
    definition: ApplicationDefinition,
    paths: ApplicationPaths,
    options: InstallOptions,
): Promise<void> {
    await ensure_directory(paths.mainDirectory);
    await ensure_directory(paths.installDirectory);

    let lastBackup: BackupExecutionResult | undefined;

    const backupResult = await prepare_installation_directory({
        directory: paths.installDirectory,
        product_name: `${definition.name} installation`,
        create_backup: async () => {
            const backupName =
                options.customName && options.customName.length > 0
                    ? options.customName
                    : (definition.install?.preInstallBackupName ??
                      definition.backup.defaultBaseName);

            lastBackup = await executeBackup(definition, paths, {
                includeAll: options.includeAll,
                includeTimestamp: true,
                customName: backupName,
                customDirectory: options.customDirectory,
                emitConsoleOutput: false,
            });

            return lastBackup.filePath;
        },
    });

    try {
        await install_release_from_github({
            repo: definition.repo,
            asset_pattern: definition.assetPattern,
            install_dir: paths.installDirectory,
            product_name: definition.name,
        });

        if (paths.executableLink && paths.executableTarget) {
            await register_executable_link({
                directory: dirname(paths.executableLink),
                link_path: paths.executableLink,
                target_path: paths.executableTarget,
                binary_name:
                    definition.binaryName ?? `${definition.name} executable`,
            });
        }

        if (definition.buildDesktopEntryOptions && paths.desktopFile) {
            const optionsDescriptor =
                definition.buildDesktopEntryOptions(paths);
            if (optionsDescriptor && paths.desktopDirectory) {
                await setup_desktop_entry({
                    directory: paths.desktopDirectory,
                    desktop_file: paths.desktopFile,
                    options: optionsDescriptor,
                    product_name: definition.name,
                });
            }
        }

        log.success(`${definition.name} installation process completed`);
    } catch (error) {
        log.error((error as Error).message);
        await attempt_restore_installation({
            should_restore: backupResult.created,
            product_name: `${definition.name} installation`,
            restore: async () => {
                if (lastBackup) {
                    await restore_backup_archive({
                        archivePath: lastBackup.filePath,
                        targetDirectory: paths.mainDirectory,
                    });
                    return lastBackup.filePath;
                }
                return undefined;
            },
        });
        throw error;
    }
}

async function executeUninstall(
    definition: ApplicationDefinition,
    paths: ApplicationPaths,
): Promise<void> {
    const config = definition.uninstall;

    if (config?.directories) {
        for (const target of config.directories(paths)) {
            if (await is_directory(target.path)) {
                if (target.description) {
                    log.info(target.description);
                } else {
                    log.info(`Removing directory ${target.path}`);
                }
                await delete_recursively(target.path);
            }
        }
    }

    if (config?.symlinks) {
        for (const target of config.symlinks(paths)) {
            if (await is_symlink(target.path)) {
                if (target.description) {
                    log.info(target.description);
                } else {
                    log.info(`Removing symlink ${target.path}`);
                }
                await rm(target.path, { force: true });
            }
        }
    }

    if (config?.files) {
        for (const target of config.files(paths)) {
            if (await path_exists(target.path)) {
                if (target.description) {
                    log.info(target.description);
                } else {
                    log.info(`Removing file ${target.path}`);
                }
                await rm(target.path, { force: true });
            }
        }
    }

    if (config?.extraSteps) {
        await config.extraSteps(paths);
    }

    if (config?.emptyDirectories) {
        for (const target of config.emptyDirectories(paths)) {
            if (
                (await is_directory(target.path)) &&
                (await directory_is_empty(target.path))
            ) {
                if (target.description) {
                    log.info(target.description);
                } else {
                    log.info(`Removing empty directory ${target.path}`);
                }
                await delete_recursively(target.path);
            }
        }
    }

    log.success(`${definition.name} uninstallation completed`);
}
