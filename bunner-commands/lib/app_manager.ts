import { $ } from 'bunner/framework';
import { log } from 'bunner/framework';
import { dirname, join, resolve as resolve_path } from 'node:path';
import { readdir, symlink, unlink, writeFile } from 'node:fs/promises';

import create_zip_archive from './functions/create_zip_archive';
import delete_recursively from './functions/delete_recursively';
import download_and_extract_archive from './functions/download_and_extract_archive';
import ensure_directory from './functions/ensure_directory';
import extract_archive from './functions/extract_archive';
import get_latest_github_release_asset_url from './functions/get_latest_github_release_asset_url';
import is_directory from './functions/is_directory';

export type DesktopEntryConfig = {
    version: string;
    name: string;
    comment: string;
    generic_name: string;
    keywords: string[];
    exec: string;
    terminal: boolean;
    type: string;
    icon: string;
    categories: string[];
    mime_type: string[];
    startup_notify: boolean;
    additional_fields?: Record<string, string>;
};

export type AppPathsConfig = {
    main_directory: string;
    install_directory: string;
    executable_link: string;
    executable_target: string;
    desktop_file: string;
    icon_path: string;
    cache_directories: string[];
    profile_directories: string[];
};

export type BackupConfig = {
    default_base_name: string;
    pre_install_backup_name: string;
    environment_variable?: string;
    exclude_patterns: string[];
    include_all_suffix?: string;
};

export type AppConfig = {
    id: string;
    name: string;
    repository: string;
    asset_pattern: string;
    paths: AppPathsConfig;
    backup: BackupConfig;
    desktop_entry: DesktopEntryConfig;
};

type BackupParams = {
    config: AppConfig;
    backup_name?: string;
    use_timestamp?: boolean;
    backup_all?: boolean;
    custom_backup_dir?: string;
};

type RestoreParams = {
    config: AppConfig;
    backup_file: string;
};

type UninstallParams = {
    config: AppConfig;
};

type InstallParams = {
    config: AppConfig;
};

function expand_env_variables(value: string): string {
    const home_resolved = value.startsWith('~')
        ? `${process.env.HOME ?? ''}${value.slice(1)}`
        : value;

    return home_resolved.replace(/\$([A-Z0-9_]+)|\$\{([A-Z0-9_]+)\}/gi, (match, p1, p2) => {
        const key = (p1 ?? p2) as string | undefined;
        if (!key) {
            return match;
        }

        const env_value = process.env[key];
        return env_value ?? match;
    });
}

function resolve_path_value(value: string): string {
    return resolve_path(expand_env_variables(value));
}

async function ensure_parent_directory(path: string): Promise<void> {
    const parent_directory = dirname(path);
    await ensure_directory(parent_directory);
}

async function read_directory_entries(directory_path: string): Promise<string[]> {
    try {
        return await readdir(directory_path);
    } catch {
        return [];
    }
}

async function is_directory_non_empty(directory_path: string): Promise<boolean> {
    const entries = await read_directory_entries(directory_path);
    return entries.length > 0;
}

function join_semicolon(values: string[]): string {
    return values.length > 0 ? `${values.join(';')};` : '';
}

async function write_desktop_entry({
    config,
    desktop_file_path,
}: {
    config: DesktopEntryConfig;
    desktop_file_path: string;
}): Promise<void> {
    await ensure_parent_directory(desktop_file_path);

    const lines: string[] = ['[Desktop Entry]'];
    lines.push(`Version=${config.version}`);
    lines.push(`Name=${config.name}`);
    lines.push(`Comment=${config.comment}`);
    lines.push(`GenericName=${config.generic_name}`);
    lines.push(`Keywords=${join_semicolon(config.keywords)}`);
    lines.push(`Exec=${config.exec}`);
    lines.push(`Terminal=${config.terminal ? 'true' : 'false'}`);
    lines.push(`Type=${config.type}`);
    lines.push(`Icon=${config.icon}`);
    lines.push(`Categories=${join_semicolon(config.categories)}`);
    lines.push(`MimeType=${join_semicolon(config.mime_type)}`);
    lines.push(`StartupNotify=${config.startup_notify ? 'true' : 'false'}`);

    if (config.additional_fields) {
        for (const [field_key, field_value] of Object.entries(config.additional_fields)) {
            lines.push(`${field_key}=${field_value}`);
        }
    }

    lines.push('');

    await writeFile(desktop_file_path, `${lines.join('\n')}`, 'utf8');
}

async function create_symlink({ source, link }: { source: string; link: string }): Promise<void> {
    await ensure_parent_directory(link);
    try {
        await unlink(link);
    } catch {}
    await symlink(source, link);
}

function get_backup_directory(config: AppConfig, custom_backup_dir?: string): string {
    if (custom_backup_dir) {
        return resolve_path_value(custom_backup_dir);
    }

    const env_var = config.backup.environment_variable;
    if (env_var && process.env[env_var]) {
        return resolve_path_value(process.env[env_var]!);
    }

    throw new Error(
        `No backup directory specified. Either set ${env_var ?? 'backup environment variable'} or provide custom_backup_dir`,
    );
}

function generate_backup_filename({
    config,
    backup_name,
    use_timestamp,
    backup_all,
}: {
    config: AppConfig;
    backup_name?: string;
    use_timestamp?: boolean;
    backup_all?: boolean;
}): string {
    const base_name = backup_name ?? config.backup.default_base_name;
    const parts: string[] = [base_name];

    if (backup_all && config.backup.include_all_suffix) {
        parts.push(config.backup.include_all_suffix);
    }

    if (use_timestamp) {
        const now = new Date();
        const timestamp = now
            .toISOString()
            .replace('T', ':')
            .replace(/\.\d+Z$/, '')
            .replace(/[-:]/g, ':');
        parts.push(timestamp);
    }

    return `${parts.join('-')}.zip`;
}

async function list_backup_files(backup_dir: string): Promise<string[]> {
    if (!(await is_directory(backup_dir))) {
        return [];
    }

    const entries = await readdir(backup_dir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.zip'))
        .map((entry) => join(backup_dir, entry.name));
}

export async function backup({
    config,
    backup_name,
    use_timestamp = false,
    backup_all = false,
    custom_backup_dir,
}: BackupParams): Promise<string> {
    log.info(`Creating backup for ${config.name}`);

    const backup_dir = get_backup_directory(config, custom_backup_dir);
    await ensure_directory(backup_dir);

    const filename = generate_backup_filename({
        config,
        backup_name,
        use_timestamp,
        backup_all,
    });

    const backup_file = join(backup_dir, filename);
    const main_directory = resolve_path_value(config.paths.main_directory);

    log.info(`Backing up ${main_directory} to ${backup_file}`);

    const exclude_patterns = backup_all ? [] : config.backup.exclude_patterns;

    await create_zip_archive({
        source_directory: main_directory,
        output_file: backup_file,
        exclude_patterns,
    });

    log.success(`Backup completed: ${backup_file}`);
    return backup_file;
}

export async function restore({ config, backup_file }: RestoreParams): Promise<void> {
    log.info(`Restoring backup for ${config.name}`);

    const resolved_backup_file = resolve_path_value(backup_file);
    const main_directory = resolve_path_value(config.paths.main_directory);

    // Check if backup file exists
    const file_exists = await Bun.file(resolved_backup_file).exists();
    if (!file_exists) {
        // Try to find available backups
        const backup_dir = get_backup_directory(config);
        const available_backups = await list_backup_files(backup_dir);

        if (available_backups.length === 0) {
            throw new Error(
                `No backup file found at ${resolved_backup_file} and no backups available in ${backup_dir}`,
            );
        }

        log.error(`Backup file not found: ${resolved_backup_file}`);
        log.info(`Available backups in ${backup_dir}:`);
        available_backups.forEach((file) => log.info(`  ${file}`));

        throw new Error(`Backup file not found: ${resolved_backup_file}`);
    }

    log.info(`Restoring from ${resolved_backup_file} to ${main_directory}`);

    await ensure_directory(main_directory);

    await extract_archive({
        archive_path: resolved_backup_file,
        output_directory: main_directory,
    });

    log.success(`Restore completed from ${resolved_backup_file}`);
}

function collect_command_env(config: AppConfig): Record<string, string | undefined> | undefined {
    if (!config.backup.environment_variable) {
        return undefined;
    }

    return {
        [config.backup.environment_variable]: process.env[config.backup.environment_variable],
    };
}

export async function uninstall({ config }: UninstallParams): Promise<void> {
    log.info(`Uninstalling ${config.name}`);

    const install_directory = resolve_path_value(config.paths.install_directory);
    const executable_link = resolve_path_value(config.paths.executable_link);
    const desktop_file_path = resolve_path_value(config.paths.desktop_file);
    const cache_directories = config.paths.cache_directories.map(resolve_path_value);
    const profile_directories = config.paths.profile_directories.map(resolve_path_value);
    const main_directory = resolve_path_value(config.paths.main_directory);

    await delete_recursively(install_directory);
    await delete_recursively(executable_link);
    await delete_recursively(desktop_file_path);

    for (const cache_dir of cache_directories) {
        await delete_recursively(cache_dir);
    }

    for (const profile_dir of profile_directories) {
        await delete_recursively(profile_dir);
    }

    if (!(await is_directory_non_empty(main_directory))) {
        await delete_recursively(main_directory);
    }

    log.success(`${config.name} uninstalled`);
}

export async function install({ config }: InstallParams): Promise<void> {
    log.info(`Installing ${config.name}`);

    const main_directory = resolve_path_value(config.paths.main_directory);
    const install_directory = resolve_path_value(config.paths.install_directory);
    const executable_link = resolve_path_value(config.paths.executable_link);
    const executable_target = resolve_path_value(config.paths.executable_target);
    const desktop_file_path = resolve_path_value(config.paths.desktop_file);
    const icon_path = resolve_path_value(config.paths.icon_path);

    await ensure_directory(main_directory);
    await ensure_directory(install_directory);

    if (await is_directory_non_empty(install_directory)) {
        log.info(`Existing installation detected at ${install_directory}`);
        await backup({
            config,
            backup_name: config.backup.pre_install_backup_name,
            use_timestamp: true,
        });
        await delete_recursively(install_directory);
        await ensure_directory(install_directory);
    }

    const archive_url = await get_latest_github_release_asset_url(
        config.repository,
        config.asset_pattern,
    );

    await download_and_extract_archive({
        archive_url,
        target_directory: install_directory,
    });

    if (!(await is_directory_non_empty(install_directory))) {
        throw new Error(`Extraction failed for ${config.name}, install directory is empty.`);
    }

    await ensure_directory(dirname(executable_target));
    await create_symlink({ source: executable_target, link: executable_link });

    await ensure_parent_directory(icon_path);

    await write_desktop_entry({
        config: {
            ...config.desktop_entry,
            exec: resolve_path_value(config.desktop_entry.exec),
            icon: icon_path,
        },
        desktop_file_path,
    });

    log.success(`${config.name} installed`);
}
