import { rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname } from 'node:path';

import { isEmpty, log } from 'bunner/framework';

import attempt_restore_installation from '../functions/attempt_restore_installation';
import create_zip_backup from '../functions/create_zip_backup';
import resolve_backup_destination from '../functions/resolve_backup_destination';
import resolve_restore_file from '../functions/resolve_restore_file';
import restore_backup_archive from '../functions/restore_backup_archive';
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
import type { ApplicationBackupConfig, ApplicationDefinition, ApplicationPaths } from './types';

export type ApplicationCommandMode = 'install' | 'backup' | 'restore' | 'uninstall';

export type ApplicationCommandParameters = {
    mode: ApplicationCommandMode;
    include_all?: boolean;
    include_timestamp?: boolean;
    custom_name?: string;
    custom_directory?: string;
    restore_file?: string | null;
};

type BackupExecutionResult = {
    file_path: string;
    directory: string;
};

type BackupOptions = {
    include_all: boolean;
    include_timestamp: boolean;
    custom_name?: string;
    custom_directory?: string;
    emit_console_output: boolean;
};

type RestoreOptions = {
    include_all: boolean;
    include_timestamp: boolean;
    custom_name?: string;
    custom_directory?: string;
    provided_path?: string | null;
    emit_console_output: boolean;
};

export async function manage_application(
    definition: ApplicationDefinition,
    {
        mode,
        include_all = false,
        include_timestamp = false,
        custom_name,
        custom_directory,
        restore_file,
    }: ApplicationCommandParameters,
): Promise<void> {
    const home_directory = process.env.HOME ?? homedir();
    const paths = definition.resolve_paths(home_directory);

    switch (mode) {
        case 'backup':
            await execute_backup({
                paths,
                backup_config: definition.backup,
                options: {
                    include_all: include_all ?? false,
                    include_timestamp,
                    custom_name,
                    custom_directory,
                    emit_console_output: true,
                },
            });
            return;
        case 'restore':
            await execute_restore(definition, paths, {
                include_all,
                include_timestamp,
                custom_name,
                custom_directory,
                provided_path: restore_file,
                emit_console_output: true,
            });
            return;
        case 'install':
            await execute_install(definition, paths, {
                include_all,
                custom_name,
                custom_directory,
            });
            return;
        case 'uninstall':
            await execute_uninstall(definition, paths);
            return;
    }
}

async function execute_backup({
    backup_config: {
        default_base_name,
        include_all_suffix,
        environment_variable,
        exclude_patterns,
        fallback_directory,
    },
    options: { include_all, custom_name, custom_directory, include_timestamp },
    paths,
}: {
    paths: ApplicationPaths;
    backup_config: ApplicationBackupConfig;
    options: BackupOptions;
}): Promise<BackupExecutionResult> {
    await ensure_directory(paths.main_directory);

    const suffixes: string[] = [];
    if (include_all && include_all_suffix) {
        suffixes.push(include_all_suffix);
    }

    const { file_path, directory } = await resolve_backup_destination({
        base_name: !isEmpty(custom_name) ? custom_name : default_base_name,
        custom_directory,
        environment_variable,
        suffixes,
        include_timestamp,
        fallback_directory: fallback_directory?.(paths),
    });

    log.info(`Creating backup from ${paths.main_directory}`);

    const created_backup = await create_zip_backup({
        source_directory: paths.main_directory,
        destination_file: file_path,
        exclude_patterns: include_all ? [] : exclude_patterns,
    });

    log.success(`Backup created at ${created_backup}`);

    console.log(created_backup);

    return { file_path: created_backup, directory };
}

async function execute_restore(
    definition: ApplicationDefinition,
    paths: ApplicationPaths,
    options: RestoreOptions,
): Promise<string> {
    await ensure_directory(paths.main_directory);

    const fallback_directory = definition.backup.fallback_directory
        ? definition.backup.fallback_directory(paths)
        : undefined;

    const { directory: backup_directory } = await resolve_backup_destination({
        base_name:
            options.custom_name && options.custom_name.length > 0
                ? options.custom_name
                : definition.backup.default_base_name,
        custom_directory: options.custom_directory,
        fallback_directory,
        environment_variable: definition.backup.environment_variable,
        suffixes: [],
        include_timestamp: options.include_timestamp,
    });

    const restore_result = await resolve_restore_file({
        provided_path: options.provided_path,
        backup_directory,
    });

    if (restore_result.status === 'found') {
        log.info(
            `Restoring ${definition.name} from ${restore_result.file_path} to ${paths.main_directory}`,
        );
        await restore_backup_archive({
            archive_path: restore_result.file_path,
            target_directory: paths.main_directory,
        });
        log.success('Restore completed');
        if (options.emit_console_output) {
            console.log(restore_result.file_path);
        }
        return restore_result.file_path;
    }

    const { available_backups, requested_path, reason } = restore_result;

    if (requested_path) {
        log.error(`No backup file found at ${requested_path}`);
    }

    if (available_backups.length > 0) {
        log.info(`Available backups in ${backup_directory}:`);
        for (const backup of available_backups) {
            log.info(`  ${basename(backup)}`);
        }
        log.info(`Use \`${definition.id} --restore <file>\` to restore a specific backup.`);
    } else if (reason === 'no-backups') {
        log.error('No backup files found. Create a backup before attempting a restore.');
    }

    if (reason === 'missing') {
        throw new Error(`Cannot restore because backup file ${requested_path} does not exist.`);
    }

    if (reason === 'no-backups') {
        throw new Error('No backup files available to restore.');
    }

    throw new Error('No backup file specified for restore.');
}

type InstallOptions = {
    include_all: boolean;
    custom_name?: string;
    custom_directory?: string;
};

async function execute_install(
    definition: ApplicationDefinition,
    paths: ApplicationPaths,
    options: InstallOptions,
): Promise<void> {
    await ensure_directory(paths.main_directory);
    await ensure_directory(paths.install_directory);

    let last_backup: BackupExecutionResult | undefined;

    const backup_result = await prepare_installation_directory({
        directory: paths.install_directory,
        product_name: `${definition.name} installation`,
        create_backup: async () => {
            const backup_name =
                options.custom_name && options.custom_name.length > 0
                    ? options.custom_name
                    : (definition.install?.pre_install_backup_name ??
                      definition.backup.default_base_name);

            last_backup = await execute_backup({
                backup_config: definition.backup,
                paths,
                options: {
                    include_all: options.include_all,
                    include_timestamp: true,
                    custom_name: backup_name,
                    custom_directory: options.custom_directory,
                    emit_console_output: false,
                },
            });

            return last_backup.file_path;
        },
    });

    try {
        await install_release_from_github({
            repo: definition.repo,
            asset_pattern: definition.asset_pattern,
            install_dir: paths.install_directory,
            product_name: definition.name,
        });

        if (paths.executable_link && paths.executable_target) {
            await register_executable_link({
                directory: dirname(paths.executable_link),
                link_path: paths.executable_link,
                target_path: paths.executable_target,
                binary_name: definition.binary_name ?? `${definition.name} executable`,
            });
        }

        if (definition.build_desktop_entry_options && paths.desktop_file) {
            const options_descriptor = definition.build_desktop_entry_options(paths);
            if (options_descriptor && paths.desktop_directory) {
                await setup_desktop_entry({
                    directory: paths.desktop_directory,
                    desktop_file: paths.desktop_file,
                    options: options_descriptor,
                    product_name: definition.name,
                });
            }
        }

        log.success(`${definition.name} installation process completed`);
    } catch (error) {
        log.error((error as Error).message);
        await attempt_restore_installation({
            should_restore: backup_result.created,
            product_name: `${definition.name} installation`,
            restore: async () => {
                if (last_backup) {
                    await restore_backup_archive({
                        archive_path: last_backup.file_path,
                        target_directory: paths.main_directory,
                    });
                    return last_backup.file_path;
                }
                return undefined;
            },
        });
        throw error;
    }
}

async function execute_uninstall(
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

    if (config?.extra_steps) {
        await config.extra_steps(paths);
    }

    if (config?.empty_directories) {
        for (const target of config.empty_directories(paths)) {
            if ((await is_directory(target.path)) && (await directory_is_empty(target.path))) {
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
