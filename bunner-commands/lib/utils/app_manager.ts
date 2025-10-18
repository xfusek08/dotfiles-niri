import { log } from 'bunner/framework';
import { dirname, join } from 'node:path';
import { readdir, symlink, unlink, writeFile } from 'node:fs/promises';

import { createZipArchive, downloadAndExtractArchive, extractArchive } from './archive';
import { deleteRecursively, ensureDirectory, isDirectory, isDirectoryNonEmpty } from './fileSystem';
import { getLatestGithubReleaseAssetUrl } from './github';
import { resolvePath, canonicalizePath } from './path';
import { DESKTOP_ENTRY_HEADER, BACKUP_FILE_EXTENSION } from './constants';
import { isNodeError, withErrorContext } from './types';
import { generateBackupTimestamp } from './timestamp';
import { validateAppConfig } from './configValidator';

export type DesktopEntryConfig = {
    version: string;
    name: string;
    comment: string;
    genericName: string;
    keywords: string[];
    exec: string;
    terminal: boolean;
    type: string;
    icon: string;
    categories: string[];
    mimeType: string[];
    startupNotify: boolean;
    additionalFields?: Record<string, string>;
};

export type AppPathsConfig = {
    mainDirectory: string;
    installDirectory: string;
    executableLink: string;
    executableTarget: string;
    desktopFile: string;
    iconPath: string;
    cacheDirectories: string[];
    profileDirectories: string[];
};

export type BackupConfig = {
    defaultBaseName: string;
    preInstallBackupName: string;
    environmentVariable?: string;
    excludePatterns: string[];
    includeAllSuffix?: string;
};

export type AppConfig = {
    id: string;
    name: string;
    repository: string;
    assetPattern: string;
    paths: AppPathsConfig;
    backup: BackupConfig;
    desktopEntry: DesktopEntryConfig;
};

export type BackupParams = {
    config: AppConfig;
    backupName?: string;
    useTimestamp?: boolean;
    backupAll?: boolean;
    customBackupDir?: string;
};

export type RestoreParams = {
    config: AppConfig;
    backupFile: string;
};

export type UninstallParams = {
    config: AppConfig;
};

export type InstallParams = {
    config: AppConfig;
};

type ResolvedPaths = {
    mainDirectory: string;
    installDirectory: string;
    executableLink: string;
    executableTarget: string;
    desktopFilePath: string;
    iconPath: string;
    cacheDirectories: string[];
    profileDirectories: string[];
};

/**
 * Resolves all paths in the app configuration to their absolute forms.
 * @param config - The application configuration
 * @returns Object containing all resolved paths
 */
async function resolveAppPaths(config: AppConfig): Promise<ResolvedPaths> {
    const [
        mainDirectory,
        installDirectory,
        executableTarget,
        desktopFilePath,
        iconPath,
        cacheDirectories,
        profileDirectories,
        executableLink,
    ] = await Promise.all([
        canonicalizePath(config.paths.mainDirectory),
        canonicalizePath(config.paths.installDirectory),
        canonicalizePath(config.paths.executableTarget),
        canonicalizePath(config.paths.desktopFile),
        canonicalizePath(config.paths.iconPath),
        Promise.all(config.paths.cacheDirectories.map(canonicalizePath)),
        Promise.all(config.paths.profileDirectories.map(canonicalizePath)),
        // Don't canonicalize executableLink - preserve for desktop file Exec field
        resolvePath(config.paths.executableLink),
    ]);

    return {
        mainDirectory,
        installDirectory,
        executableLink,
        executableTarget,
        desktopFilePath,
        iconPath,
        cacheDirectories,
        profileDirectories,
    };
}

async function ensureParentDirectory(path: string): Promise<void> {
    const parentDirectory = dirname(path);
    await ensureDirectory(parentDirectory);
}

function joinSemicolon(values: string[]): string {
    return values.length > 0 ? `${values.join(';')};` : '';
}

async function writeDesktopEntry({
    config,
    desktopFilePath,
}: {
    config: DesktopEntryConfig;
    desktopFilePath: string;
}): Promise<void> {
    await ensureParentDirectory(desktopFilePath);

    const lines: string[] = [DESKTOP_ENTRY_HEADER];
    lines.push(`Version=${config.version}`);
    lines.push(`Name=${config.name}`);
    lines.push(`Comment=${config.comment}`);
    lines.push(`GenericName=${config.genericName}`);
    lines.push(`Keywords=${joinSemicolon(config.keywords)}`);
    lines.push(`Exec=${config.exec}`);
    lines.push(`Terminal=${config.terminal ? 'true' : 'false'}`);
    lines.push(`Type=${config.type}`);
    lines.push(`Icon=${config.icon}`);
    lines.push(`Categories=${joinSemicolon(config.categories)}`);
    lines.push(`MimeType=${joinSemicolon(config.mimeType)}`);
    lines.push(`StartupNotify=${config.startupNotify ? 'true' : 'false'}`);

    if (config.additionalFields) {
        for (const [fieldKey, fieldValue] of Object.entries(config.additionalFields)) {
            lines.push(`${fieldKey}=${fieldValue}`);
        }
    }

    lines.push('');

    await writeFile(desktopFilePath, `${lines.join('\n')}`, 'utf8');
}

async function createSymlink({ source, link }: { source: string; link: string }): Promise<void> {
    await ensureParentDirectory(link);
    try {
        await unlink(link);
    } catch (error) {
        // Only ignore ENOENT (file doesn't exist) errors
        if (!isNodeError(error) || error.code !== 'ENOENT') {
            throw error;
        }
    }
    await symlink(source, link);
}

async function getBackupDirectory(config: AppConfig, customBackupDir?: string): Promise<string> {
    if (customBackupDir) {
        return await canonicalizePath(customBackupDir);
    }

    const envVar = config.backup.environmentVariable;
    if (envVar && process.env[envVar]) {
        return await canonicalizePath(process.env[envVar]!);
    }

    throw new Error(
        `No backup directory specified. Either set ${envVar ?? 'backup environment variable'} or provide customBackupDir`,
    );
}

function generateBackupFilename({
    config,
    backupName,
    useTimestamp,
    backupAll,
}: {
    config: AppConfig;
    backupName?: string;
    useTimestamp?: boolean;
    backupAll?: boolean;
}): string {
    const baseName = backupName ?? config.backup.defaultBaseName;
    const parts: string[] = [baseName];

    if (backupAll && config.backup.includeAllSuffix) {
        parts.push(config.backup.includeAllSuffix);
    }

    if (useTimestamp) {
        const timestamp = generateBackupTimestamp();
        parts.push(timestamp);
    }

    return `${parts.join('-')}${BACKUP_FILE_EXTENSION}`;
}

async function listBackupFiles(backupDir: string): Promise<string[]> {
    if (!(await isDirectory(backupDir))) {
        return [];
    }

    const entries = await readdir(backupDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(BACKUP_FILE_EXTENSION))
        .map((entry) => join(backupDir, entry.name));
}

export async function backup({
    config,
    backupName,
    useTimestamp = false,
    backupAll = false,
    customBackupDir,
}: BackupParams): Promise<string> {
    log.info(`Creating backup for ${config.name}`);

    const backupDir = await getBackupDirectory(config, customBackupDir);
    await ensureDirectory(backupDir);

    const filename = generateBackupFilename({
        config,
        backupName,
        useTimestamp,
        backupAll,
    });

    const backupFile = join(backupDir, filename);
    const mainDirectory = await canonicalizePath(config.paths.mainDirectory);

    log.info(`Backing up ${mainDirectory} to ${backupFile}`);

    const excludePatterns = backupAll ? [] : config.backup.excludePatterns;

    await createZipArchive({
        sourceDirectory: mainDirectory,
        outputFile: backupFile,
        excludePatterns,
    });

    log.success(`Backup completed: ${backupFile}`);
    return backupFile;
}

export async function restore({ config, backupFile }: RestoreParams): Promise<void> {
    log.info(`Restoring backup for ${config.name}`);

    const resolvedBackupFile = await canonicalizePath(backupFile);
    const mainDirectory = await canonicalizePath(config.paths.mainDirectory);

    // Check if backup file exists
    const fileExists = await Bun.file(resolvedBackupFile).exists();
    if (!fileExists) {
        // Try to find available backups
        const backupDir = await getBackupDirectory(config);
        const availableBackups = await listBackupFiles(backupDir);

        if (availableBackups.length === 0) {
            throw new Error(
                `No backup file found at ${resolvedBackupFile} and no backups available in ${backupDir}`,
            );
        }

        log.error(`Backup file not found: ${resolvedBackupFile}`);
        log.info(`Available backups in ${backupDir}:`);
        availableBackups.forEach((file) => log.info(`  ${file}`));

        throw new Error(`Backup file not found: ${resolvedBackupFile}`);
    }

    log.info(`Restoring from ${resolvedBackupFile} to ${mainDirectory}`);

    await ensureDirectory(mainDirectory);

    await extractArchive({
        archivePath: resolvedBackupFile,
        outputDirectory: mainDirectory,
    });

    log.success(`Restore completed from ${resolvedBackupFile}`);
}

export async function uninstall({ config }: UninstallParams): Promise<void> {
    log.info(`Uninstalling ${config.name}`);

    const paths = await resolveAppPaths(config);

    await withErrorContext(
        () => deleteRecursively(paths.installDirectory),
        `Failed to delete installation directory: ${paths.installDirectory}`,
    );

    await withErrorContext(
        () => deleteRecursively(paths.executableLink),
        `Failed to delete executable link: ${paths.executableLink}`,
    );

    await withErrorContext(
        () => deleteRecursively(paths.desktopFilePath),
        `Failed to delete desktop file: ${paths.desktopFilePath}`,
    );

    for (const cacheDir of paths.cacheDirectories) {
        await withErrorContext(
            () => deleteRecursively(cacheDir),
            `Failed to delete cache directory: ${cacheDir}`,
        );
    }

    for (const profileDir of paths.profileDirectories) {
        await withErrorContext(
            () => deleteRecursively(profileDir),
            `Failed to delete profile directory: ${profileDir}`,
        );
    }

    if (!(await isDirectoryNonEmpty(paths.mainDirectory))) {
        await withErrorContext(
            () => deleteRecursively(paths.mainDirectory),
            `Failed to delete main directory: ${paths.mainDirectory}`,
        );
    }

    log.success(`${config.name} uninstalled`);
}

export async function install({ config }: InstallParams): Promise<void> {
    validateAppConfig(config);
    log.info(`Installing ${config.name}`);

    const paths = await resolveAppPaths(config);

    await ensureDirectory(paths.mainDirectory);
    await ensureDirectory(paths.installDirectory);

    const archiveUrl = await getLatestGithubReleaseAssetUrl(config.repository, config.assetPattern);

    await downloadAndExtractArchive({
        archiveUrl: archiveUrl,
        targetDirectory: paths.installDirectory,
    });

    if (!(await isDirectoryNonEmpty(paths.installDirectory))) {
        throw new Error(`Extraction failed for ${config.name}, install directory is empty.`);
    }

    await ensureDirectory(dirname(paths.executableTarget));
    await createSymlink({
        source: paths.executableTarget,
        link: paths.executableLink,
    });

    await ensureParentDirectory(paths.iconPath);

    await writeDesktopEntry({
        config: {
            ...config.desktopEntry,
            exec: paths.executableLink,
            icon: paths.iconPath,
        },
        desktopFilePath: paths.desktopFilePath,
    });

    log.success(`${config.name} installed`);
}
