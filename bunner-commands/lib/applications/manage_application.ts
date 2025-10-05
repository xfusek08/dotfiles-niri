import { rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';

import { isEmpty, isNotNil, log } from 'bunner/framework';

import attempt_restore_installation from '../functions/attempt_restore_installation';
import create_zip_backup from '../functions/create_zip_backup';
import resolve_backup_destination, {
    ResolveBackupDestinationOptions,
} from '../functions/resolve_backup_destination';
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
import type { ApplicationDefinition, ApplicationPaths, UninstallTarget } from './types';
import async_find from 'lib/functions/async_find';
import list_backup_files from 'lib/functions/list_backup_files';
import directory_has_contents from 'lib/functions/directory_has_contents';
import backup_existing_directory from 'lib/functions/backup_existing_directory';
import build_timestamp from 'lib/functions/build_timestamp';

export type ApplicationCommandMode = 'install' | 'backup' | 'restore' | 'uninstall';

type BackupExecutionResult = {
    file_path: string;
    directory: string;
};

type ManageContext = {
    definition: ApplicationDefinition;
    paths: ApplicationPaths;
    include_all: boolean;
    include_timestamp: boolean;
    custom_name?: string;
    custom_directory?: string;
    restore_file?: string | null;
};

export async function manage_application(
    mode: ApplicationCommandMode,
    context: ManageContext,
): Promise<void> {
    switch (mode) {
        case 'install':
            await execute_install(context);
            break;
        case 'backup':
            await execute_backup(context);
            break;
        case 'restore':
            await execute_restore(context);
            break;
        case 'uninstall':
            await execute_uninstall(context);
            break;
    }
}

async function execute_backup(context: ManageContext): Promise<BackupExecutionResult> {
    const { definition, paths, include_all } = context;
    const { exclude_patterns } = definition.backup;

    if (!(await is_directory(paths.main_directory))) {
        throw new Error(`No installation found at ${paths.main_directory} to be backed up.`);
    }

    const { file_path, directory } = await resolve_backup_directory_from_backup_definition(context);

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

async function execute_restore(context: ManageContext): Promise<string> {
    const { paths, definition, restore_file } = context;

    await ensure_directory(paths.main_directory);

    const { directory: backup_directory } =
        await resolve_backup_directory_from_backup_definition(context);

    const pretty_fail = async () => {
        const available_backups = await list_backup_files({
            directory: backup_directory,
            extension: '.zip',
        });

        if (!isEmpty(available_backups.length)) {
            log.info(`Available backups in ${backup_directory}:`);
            for (const backup of available_backups) {
                log.info(`  ${basename(backup)}`);
            }
            log.info(`Use \`${definition.id} --restore <file>\` to restore a specific backup.`);
        } else {
            log.error('No backup files found. Create a backup before attempting a restore.');
        }

        return new Error(
            `No valid backup file specified for restore. Requested: "${restore_file}"`,
        );
    };

    const trimmed_restore_path = restore_file?.trim();
    if (isEmpty(trimmed_restore_path)) {
        throw await pretty_fail();
    }

    const candidates = [trimmed_restore_path];

    if (!isAbsolute(trimmed_restore_path)) {
        candidates.push(join(backup_directory, trimmed_restore_path));
    }

    const restore_file_path = await async_find(candidates, (c) => path_exists(c));
    if (isEmpty(restore_file_path)) {
        throw await pretty_fail();
    }

    log.info(`Restoring ${definition.name} from ${restore_file_path} to ${paths.main_directory}`);

    await restore_backup_archive({
        archive_path: restore_file_path,
        target_directory: paths.main_directory,
    });

    log.success(`Restore completed: ${restore_file_path}`);

    return restore_file_path;
}

async function execute_install(context: ManageContext): Promise<void> {
    const { definition, paths } = context;
    await ensure_directory(paths.main_directory);
    await ensure_directory(paths.install_directory);

    let last_backup: BackupExecutionResult | undefined;

    let backup_result: BackupExecutionResult | undefined;
    if (await directory_has_contents(paths.main_directory)) {
        backup_result = await execute_backup(context);
    }

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

async function execute_uninstall({
    context: { definition, paths },
}: {
    context: ManageContext;
}): Promise<void> {
    const config = definition.uninstall;

    const uninstall_tasks: Array<{
        targets?: UninstallTarget[];
        exists: (path: string) => Promise<boolean>;
        remove: (path: string) => Promise<void>;
        message: (path: string) => string;
    }> = [
        {
            targets: config?.directories?.(paths),
            exists: is_directory,
            remove: async (path: string) => {
                await delete_recursively(path);
            },
            message: (path: string) => `Removing directory ${path}`,
        },
        {
            targets: config?.symlinks?.(paths),
            exists: is_symlink,
            remove: async (path: string) => {
                await rm(path, { force: true });
            },
            message: (path: string) => `Removing symlink ${path}`,
        },
        {
            targets: config?.files?.(paths),
            exists: path_exists,
            remove: async (path: string) => {
                await rm(path, { force: true });
            },
            message: (path: string) => `Removing file ${path}`,
        },
        {
            targets: config?.empty_directories?.(paths),
            exists: async (path: string) =>
                (await is_directory(path)) && (await directory_is_empty(path)),
            remove: async (path: string) => {
                await delete_recursively(path);
            },
            message: (path: string) => `Removing empty directory ${path}`,
        },
    ];

    for (const { targets, exists, remove, message } of uninstall_tasks) {
        if (!targets) {
            continue;
        }

        for (const target of targets) {
            if (await exists(target.path)) {
                log.info(target.description ?? message(target.path));
                await remove(target.path);
            }
        }
    }

    if (config?.extra_steps) {
        await config.extra_steps(paths);
    }

    log.success(`${definition.name} uninstallation completed`);
}

async function resolve_backup_directory_from_backup_definition({
    definition,
    include_timestamp,
    custom_name,
    custom_directory,
    include_all,
}: ManageContext) {
    const { include_all_suffix } = definition.backup;

    const suffixes: string[] = [];

    if (include_all && include_all_suffix) {
        suffixes.push(include_all_suffix);
    }

    const env_directory = definition.backup.environment_variable
        ? process.env[definition.backup.environment_variable]
        : undefined;

    const directory = [custom_directory, env_directory].find((value) => isNotNil(value));
    if (!directory) {
        throw new Error('No backup directory specified or configured.');
    }

    await ensure_directory(directory);

    const suffix_list = [...suffixes];
    if (include_timestamp) {
        suffix_list.push(build_timestamp());
    }

    const base_name = !isEmpty(custom_name) ? custom_name : definition.backup.default_base_name;
    const suffix = suffix_list.length > 0 ? `-${suffix_list.join('-')}` : '';
    const file_path = join(directory, `${base_name}${suffix}.zip`);

    return { directory, file_path };
}
