import { spawn } from 'bun';
import { log } from 'bunner/framework';
import { dirname, resolve as resolve_path } from 'node:path';
import { readdir, symlink, unlink, writeFile } from 'node:fs/promises';

import delete_recursively from './functions/delete_recursively';
import download_and_extract_archive from './functions/download_and_extract_archive';
import ensure_directory from './functions/ensure_directory';
import get_latest_github_release_asset_url from './functions/get_latest_github_release_asset_url';

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
    backup_command: string;
    paths: AppPathsConfig;
    backup: BackupConfig;
    desktop_entry: DesktopEntryConfig;
};

type RunCommandParams = {
    command: string;
    args: string[];
    env?: Record<string, string | undefined>;
};

type BackupParams = {
    config: AppConfig;
    backup_name?: string;
    use_timestamp?: boolean;
};

type RestoreParams = {
    config: AppConfig;
    backup_file?: string;
};

type UninstallParams = {
    config: AppConfig;
};

type InstallParams = {
    config: AppConfig;
};

async function run_command_capture({ command, args, env }: RunCommandParams): Promise<string> {
    const merged_env = env ? { ...process.env, ...env } : undefined;
    const spawned_process = spawn({
        cmd: [command, ...args],
        env: merged_env,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'inherit',
    });

    const stdout_response = new Response(spawned_process.stdout);
    const stderr_response = new Response(spawned_process.stderr);
    const [stdout_text, stderr_text, exit_code] = await Promise.all([
        stdout_response.text(),
        stderr_response.text(),
        spawned_process.exited,
    ]);

    if (exit_code !== 0) {
        log.error(stderr_text.trim());
        throw new Error(`Command failed (${command}): exit code ${exit_code}`);
    }

    return stdout_text.trim();
}

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

function collect_command_env(config: AppConfig): Record<string, string | undefined> | undefined {
    if (!config.backup.environment_variable) {
        return undefined;
    }

    return {
        [config.backup.environment_variable]: process.env[config.backup.environment_variable],
    };
}

export async function backup({
    config,
    backup_name,
    use_timestamp = false,
}: BackupParams): Promise<string> {
    log.info(`Creating backup for ${config.name}`);
    const args: string[] = [];

    if (use_timestamp) {
        args.push('-t');
    }

    if (backup_name) {
        args.push('-n', backup_name);
    }

    const output = await run_command_capture({
        command: config.backup_command,
        args,
        env: collect_command_env(config),
    });

    log.success(`Backup completed: ${output}`);
    return output;
}

export async function restore({ config, backup_file }: RestoreParams): Promise<string> {
    log.info(`Restoring backup for ${config.name}`);
    const args = ['-r'];
    if (backup_file) {
        args.push(backup_file);
    }

    const output = await run_command_capture({
        command: config.backup_command,
        args,
        env: collect_command_env(config),
    });

    log.success(`Restore completed`);
    return output;
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
