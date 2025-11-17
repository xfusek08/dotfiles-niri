import { $ } from 'bunner/framework';
import { log } from 'bunner/framework';
import { chmod, copyFile, readdir, symlink, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { createZipArchive, downloadFile } from './archive';
import { createTemporaryDirectory } from './temporary';
import { deleteRecursively, ensureDirectory, isDirectory, isFile } from './fileSystem';
import { APPIMAGE_PATHS } from './constants';
import { canonicalizePath, resolvePath } from './path';
import { withErrorContext } from './types';

type AppImagePaths = {
    appDir: string;
    appImagePath: string;
    launcherPath: string;
    desktopPath: string;
    iconPath: string;
    launcherSymlink: string;
    desktopSymlink: string;
};

async function downloadAppImage({
    appImageUrl,
    targetDirectory,
    appName,
}: {
    appImageUrl: string;
    targetDirectory: string;
    appName: string;
}): Promise<string> {
    await ensureDirectory(targetDirectory);
    const appImagePath = join(targetDirectory, `${appName}.AppImage`);

    log.info(`Downloading AppImage: ${appImageUrl}`);
    await downloadFile({
        url: appImageUrl,
        outputPath: appImagePath,
    });

    // Make it executable
    await chmod(appImagePath, 0o755);
    log.success(`AppImage downloaded to: ${appImagePath}`);

    return appImagePath;
}

async function extractAppImageContents(appImagePath: string): Promise<string> {
    const extractDir = await createTemporaryDirectory('appimage-extract.XXXXXX');

    log.debug(`Extracting AppImage contents to inspect: ${appImagePath}`);

    // Extract AppImage (this creates a squashfs-root directory)
    // Change to extract directory first
    const originalCwd = process.cwd();
    try {
        process.chdir(extractDir);
        await $`${appImagePath} --appimage-extract`.quiet();
    } finally {
        process.chdir(originalCwd);
    }

    const squashfsRoot = join(extractDir, 'squashfs-root');
    if (!(await isDirectory(squashfsRoot))) {
        throw new Error(`Failed to extract AppImage: ${appImagePath}`);
    }

    return squashfsRoot;
}

async function extractAppImageIcon({
    extractedImageDirectory,
    iconPathBase,
    desktopFilePath,
}: {
    extractedImageDirectory: string;
    iconPathBase: string;
    desktopFilePath?: string;
}): Promise<string | null> {
    // Read desktop file if path provided
    if (!desktopFilePath || !(await isFile(desktopFilePath))) {
        log.warn(`No valid desktop file provided for icon extraction`);
        return null;
    }

    const file = Bun.file(desktopFilePath);
    const desktopFileContent = await file.text();

    // Extract icon name from desktop file
    const iconMatch = desktopFileContent.match(/^Icon=(.+)$/m);
    if (!iconMatch) {
        log.warn(`No Icon field found in desktop file`);
        return null;
    }

    const iconName = iconMatch[1].trim();
    log.debug(`Icon name from desktop file: ${iconName}`);

    // Use find command to search for icon files matching the name
    try {
        const pngName = iconName + '.png';
        const svgName = iconName + '.svg';
        const xpmName = iconName + '.xpm';
        const anyName = iconName + '.*';

        const result =
            await $`find ${extractedImageDirectory} -type f \( -name ${pngName} -o -name ${svgName} -o -name ${xpmName} -o -name ${anyName} \)`
                .text()
                .catch(() => '');

        const foundIcon = result.trim().split('\n')[0];

        if (foundIcon && foundIcon.length > 0) {
            const iconExt = foundIcon.substring(foundIcon.lastIndexOf('.'));
            const actualTargetPath = iconPathBase + iconExt;
            await copyFile(foundIcon, actualTargetPath);
            log.debug(`Icon copied to ${actualTargetPath}`);
            return actualTargetPath;
        }
    } catch (error) {
        log.error(`Error searching for icon: ${error}`);
    }

    log.warn(`No icon found in AppImage, using default application icon`);
    return null;
}

async function findAppImageDesktopFile(squashfsRoot: string): Promise<string | null> {
    const desktopDirs = ['usr/share/applications', '.'];

    for (const desktopDir of desktopDirs) {
        const searchPath = join(squashfsRoot, desktopDir);
        if (!(await isDirectory(searchPath))) {
            continue;
        }

        try {
            const entries = await readdir(searchPath, { withFileTypes: true });
            const desktopFile = entries.find(
                (entry) => entry.isFile() && entry.name.endsWith('.desktop'),
            );

            if (desktopFile) {
                const desktopFilePath = join(searchPath, desktopFile.name);
                log.debug(`Desktop file found: ${desktopFilePath}`);
                return desktopFilePath; // Return path instead of contents
            }
        } catch (error) {
            log.debug(`Error searching for desktop file in ${searchPath}: ${error}`);
            continue;
        }
    }

    return null;
}

async function copyAppImage({
    sourceAppImagePath,
    targetDirectory,
    appName,
}: {
    sourceAppImagePath: string;
    targetDirectory: string;
    appName: string;
}): Promise<string> {
    await ensureDirectory(targetDirectory);
    const appImagePath = join(targetDirectory, `${appName}.AppImage`);

    log.info(`Copying AppImage: ${sourceAppImagePath} -> ${appImagePath}`);
    await copyFile(sourceAppImagePath, appImagePath);

    // Make it executable
    await chmod(appImagePath, 0o755);
    log.success(`AppImage copied to: ${appImagePath}`);

    return appImagePath;
}

async function obtainAppImage({
    appImageSource,
    targetDirectory,
    appName,
}: {
    appImageSource: string;
    targetDirectory: string;
    appName: string;
}): Promise<string> {
    // Check if source is a local file that exists
    if (await isFile(appImageSource)) {
        // Local file path
        return copyAppImage({ sourceAppImagePath: appImageSource, targetDirectory, appName });
    }
    // Assume it's a URL
    return downloadAppImage({ appImageUrl: appImageSource, targetDirectory, appName });
}

async function resolveAppImagePaths(appName: string): Promise<{
    appDir: string;
    appImagePath: string;
    launcherPath: string;
    desktopPath: string;
    iconPath: string;
    launcherSymlink: string;
    desktopSymlink: string;
}> {
    const [baseDir, binDir, applicationsDir] = await Promise.all([
        canonicalizePath(APPIMAGE_PATHS.BASE_DIR),
        resolvePath(APPIMAGE_PATHS.BIN_DIR),
        resolvePath(APPIMAGE_PATHS.APPLICATIONS_DIR),
    ]);

    const appDir = join(baseDir, appName);
    const appImagePath = join(appDir, `${appName}.AppImage`);
    const launcherPath = join(appDir, `${appName}-launcher.sh`);
    const desktopPath = join(appDir, `${appName}.desktop`);
    const iconPath = join(appDir, appName); // Remove .png
    const launcherSymlink = join(binDir, appName);
    const desktopSymlink = join(applicationsDir, `${appName}.desktop`);

    // Ensure all necessary directories exist
    await Promise.all([
        ensureDirectory(appDir),
        ensureDirectory(binDir),
        ensureDirectory(applicationsDir),
    ]);

    return {
        appDir,
        appImagePath,
        launcherPath,
        desktopPath,
        iconPath,
        launcherSymlink,
        desktopSymlink,
    };
}

async function createAppImageDesktopFile(paths: AppImagePaths, appName: string): Promise<void> {
    const desktopContent = `[Desktop Entry]
Version=1.0
Name=${appName}
Comment=${appName} Application
Exec=${paths.launcherSymlink} %F
Icon=${paths.iconPath}
Terminal=false
Type=Application
Categories=Utility;
`;

    await writeFile(paths.desktopPath, desktopContent, { mode: 0o644 });
    log.debug(`Desktop file created: ${paths.desktopPath}`);
}

async function createAppImageSymlinks(paths: AppImagePaths): Promise<void> {
    // Create launcher symlink
    try {
        await unlink(paths.launcherSymlink);
    } catch {
        // Ignore if symlink doesn't exist
    }
    await symlink(paths.launcherPath, paths.launcherSymlink);
    log.debug(`Launcher symlink created: ${paths.launcherSymlink} -> ${paths.launcherPath}`);

    // Create desktop file symlink
    try {
        await unlink(paths.desktopSymlink);
    } catch {
        // Ignore if symlink doesn't exist
    }
    await symlink(paths.desktopPath, paths.desktopSymlink);
    log.debug(`Desktop file symlink created: ${paths.desktopSymlink} -> ${paths.desktopPath}`);
}

/**
 * Removes symlinks for AppImage installation.
 */
async function removeAppImageSymlinks(paths: AppImagePaths): Promise<void> {
    try {
        await unlink(paths.launcherSymlink);
        log.debug(`Removed launcher symlink: ${paths.launcherSymlink}`);
    } catch (error) {
        log.debug(`Failed to remove launcher symlink (may not exist): ${paths.launcherSymlink}`);
    }

    try {
        await unlink(paths.desktopSymlink);
        log.debug(`Removed desktop file symlink: ${paths.desktopSymlink}`);
    } catch (error) {
        log.debug(`Failed to remove desktop file symlink (may not exist): ${paths.desktopSymlink}`);
    }
}

async function backupExistingAppImage({
    appName,
    paths,
}: {
    appName: string;
    paths: AppImagePaths;
}): Promise<string> {
    log.info(`AppImage "${appName}" is already installed, creating backup...`);

    const backupDir = join(dirname(paths.appDir), 'backups');
    await ensureDirectory(backupDir);

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .split('T')
        .join('_')
        .split('Z')[0];
    const backupFile = join(backupDir, `${appName}-pre-install-${timestamp}.zip`);

    await withErrorContext(async () => {
        await createZipArchive({
            sourceDirectory: paths.appDir,
            outputFile: backupFile,
            excludePatterns: [],
        });
        log.success(`Backup created: ${backupFile}`);
    }, 'Failed to create backup');

    // Remove existing installation
    await removeAppImageSymlinks(paths);
    await deleteRecursively(paths.appDir);
    await ensureDirectory(paths.appDir);
    log.info('Existing installation removed');

    return backupFile;
}

async function performAppImageInstallation({
    appName,
    appImageSource,
    paths,
}: {
    appName: string;
    appImageSource: string;
    paths: AppImagePaths;
}): Promise<string | null> {
    // Obtain AppImage (download or copy)
    await withErrorContext(
        () => obtainAppImage({ appImageSource, targetDirectory: paths.appDir, appName }),
        'Failed to obtain AppImage',
    );

    // Extract AppImage to get icon
    const squashfsRoot = await withErrorContext(
        () => extractAppImageContents(paths.appImagePath),
        'Failed to extract AppImage contents',
    );

    // Find desktop file and extract icon
    const desktopFilePath = await findAppImageDesktopFile(squashfsRoot);
    const actualIconPath = await extractAppImageIcon({
        extractedImageDirectory: squashfsRoot,
        iconPathBase: paths.iconPath,
        desktopFilePath: desktopFilePath ?? undefined,
    });

    const updatedPaths = { ...paths, iconPath: actualIconPath ?? paths.iconPath };

    // Create launcher script - a simple bash wrapper that executes the AppImage with passed arguments
    await withErrorContext(async () => {
        const launcherContent = `#!/bin/bash
# Launcher for ${updatedPaths.appImagePath}
exec "${updatedPaths.appImagePath}" "$@"
`;
        await writeFile(updatedPaths.launcherPath, launcherContent, { mode: 0o755 });
        log.debug(`Launcher script created: ${updatedPaths.launcherPath}`);
    }, 'Failed to create launcher script');

    // Create desktop file
    await withErrorContext(
        () => createAppImageDesktopFile(updatedPaths, appName),
        'Failed to create desktop file',
    );

    // Create symlinks
    await withErrorContext(() => createAppImageSymlinks(updatedPaths), 'Failed to create symlinks');

    return squashfsRoot;
}

/**
 * Installs an AppImage application with full desktop integration.
 * This is a transactional operation - if any step fails, the installation is rolled back.
 * If already installed, creates a timestamped backup before reinstalling.
 *
 * @param appName - Name of the application
 * @param appImageSource - URL or local file path to the AppImage
 */
export async function installAppImage({
    appName,
    appImageSource,
}: {
    appName: string;
    appImageSource: string;
}): Promise<void> {
    const paths = await resolveAppImagePaths(appName);
    let backupFile: string | null = null;
    let squashfsRoot: string | null = null;

    // Handle existing installation
    if (await isDirectory(paths.appDir)) {
        backupFile = await backupExistingAppImage({ appName, paths });
    }

    try {
        squashfsRoot = await performAppImageInstallation({ appName, appImageSource, paths });
        log.success(`AppImage "${appName}" installed successfully`);
        log.info(`Launch with: ${appName}`);
    } catch (error) {
        // Rollback on failure
        log.error('Installation failed, rolling back...');
        try {
            await removeAppImageSymlinks(paths);
            await deleteRecursively(paths.appDir);

            // If we had a backup, offer to restore it
            if (backupFile) {
                log.info(`Backup available at: ${backupFile}`);
                log.info(`To restore, run: brun appimage-restore -n ${appName} -b ${backupFile}`);
            }

            log.info('Rollback completed');
        } catch (rollbackError) {
            log.error(`Rollback failed: ${rollbackError}`);
        }
        throw error;
    } finally {
        // Clean up temporary extraction directory (always runs, error or not)
        if (squashfsRoot) {
            const extractDir = join(squashfsRoot, '..');
            await deleteRecursively(extractDir);
        }
    }
}

/**
 * Uninstalls an AppImage application, removing all associated files and symlinks.
 *
 * @param appName - Name of the application to uninstall
 */
export async function uninstallAppImage({ appName }: { appName: string }): Promise<void> {
    const paths = await resolveAppImagePaths(appName);

    // Check if installed
    if (!(await isDirectory(paths.appDir))) {
        throw new Error(`AppImage "${appName}" is not installed`);
    }

    log.info(`Uninstalling AppImage: ${appName}`);

    // Remove symlinks
    await removeAppImageSymlinks(paths);

    // Remove app directory
    await deleteRecursively(paths.appDir);
    log.success(`AppImage "${appName}" uninstalled successfully`);
}
