import { $ } from 'bunner/framework';
import { log } from 'bunner/framework';
import { chmod, copyFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { downloadFile } from './archive';
import { createTemporaryDirectory } from './temporary';
import { deleteRecursively, ensureDirectory, isDirectory } from './fileSystem';

/**
 * Downloads an AppImage file to the target directory.
 *
 * @param appImageUrl - URL of the AppImage to download
 * @param targetDirectory - Directory to save the AppImage
 * @param appName - Name for the AppImage file (without .AppImage extension)
 * @returns Path to the downloaded AppImage
 */
export async function downloadAppImage({
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

/**
 * Extracts the AppImage to inspect its contents (desktop file, icons, etc.)
 *
 * @param appImagePath - Path to the AppImage file
 * @returns Path to the extracted squashfs-root directory
 */
export async function extractAppImageContents(appImagePath: string): Promise<string> {
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

/**
 * Finds and copies the icon file from extracted AppImage contents.
 *
 * @param squashfsRoot - Path to the squashfs-root directory
 * @param targetIconPath - Where to copy the icon
 * @returns True if icon was found and copied, false otherwise
 */
export async function extractAppImageIcon(
    squashfsRoot: string,
    targetIconPath: string,
): Promise<boolean> {
    const iconExtensions = ['.png', '.svg', '.xpm'];
    const commonIconDirs = ['usr/share/icons', 'usr/share/pixmaps', '.'];

    for (const iconDir of commonIconDirs) {
        const searchPath = join(squashfsRoot, iconDir);
        if (!(await isDirectory(searchPath))) {
            continue;
        }

        try {
            const entries = await readdir(searchPath, { withFileTypes: true, recursive: true });

            for (const entry of entries) {
                if (!entry.isFile()) continue;

                const hasValidExt = iconExtensions.some((ext) =>
                    entry.name.toLowerCase().endsWith(ext),
                );
                if (!hasValidExt) continue;

                // Prefer larger icons (256x256, 128x128, etc.)
                const isLargeIcon =
                    /\b(256|128|scalable)\b/i.test(entry.name) ||
                    entry.name.toLowerCase().endsWith('.svg');

                if (isLargeIcon) {
                    const sourcePath = join(entry.parentPath ?? searchPath, entry.name);
                    await copyFile(sourcePath, targetIconPath);
                    log.debug(`Icon extracted: ${sourcePath} -> ${targetIconPath}`);
                    return true;
                }
            }

            // If no large icon found, try any icon
            for (const entry of entries) {
                if (!entry.isFile()) continue;

                const hasValidExt = iconExtensions.some((ext) =>
                    entry.name.toLowerCase().endsWith(ext),
                );
                if (hasValidExt) {
                    const sourcePath = join(entry.parentPath ?? searchPath, entry.name);
                    await copyFile(sourcePath, targetIconPath);
                    log.debug(`Icon extracted: ${sourcePath} -> ${targetIconPath}`);
                    return true;
                }
            }
        } catch (error) {
            log.debug(`Error searching for icon in ${searchPath}: ${error}`);
            continue;
        }
    }

    log.warn(`No icon found in AppImage, using default application icon`);
    return false;
}

/**
 * Finds a desktop file in the extracted AppImage contents.
 *
 * @param squashfsRoot - Path to the squashfs-root directory
 * @returns Contents of the desktop file, or null if not found
 */
export async function findAppImageDesktopFile(squashfsRoot: string): Promise<string | null> {
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
                const file = Bun.file(desktopFilePath);
                const contents = await file.text();
                log.debug(`Desktop file found: ${desktopFilePath}`);
                return contents;
            }
        } catch (error) {
            log.debug(`Error searching for desktop file in ${searchPath}: ${error}`);
            continue;
        }
    }

    return null;
}

/**
 * Creates a launcher script for the AppImage.
 *
 * @param appImagePath - Path to the AppImage file
 * @param launcherPath - Path where the launcher script should be created
 */
export async function createAppImageLauncher(
    appImagePath: string,
    launcherPath: string,
): Promise<void> {
    const launcherContent = `#!/bin/bash
# Launcher for ${appImagePath}
exec "${appImagePath}" "$@"
`;

    await writeFile(launcherPath, launcherContent, { mode: 0o755 });
    log.debug(`Launcher script created: ${launcherPath}`);
}

/**
 * Downloads and sets up an AppImage with desktop integration.
 *
 * @param appImageUrl - URL of the AppImage to download
 * @param targetDirectory - Directory to install the AppImage
 * @param appName - Name for the application
 * @param iconPath - Path where the icon should be saved
 * @returns Path to the downloaded AppImage
 */
export async function downloadAndSetupAppImage({
    appImageUrl,
    targetDirectory,
    appName,
    iconPath,
}: {
    appImageUrl: string;
    targetDirectory: string;
    appName: string;
    iconPath: string;
}): Promise<string> {
    const appImagePath = await downloadAppImage({
        appImageUrl,
        targetDirectory,
        appName,
    });

    // Extract AppImage to get icon and other metadata
    let squashfsRoot: string | null = null;
    try {
        squashfsRoot = await extractAppImageContents(appImagePath);

        // Extract icon
        await extractAppImageIcon(squashfsRoot, iconPath);
    } catch (error) {
        log.warn(`Failed to extract AppImage contents: ${error}`);
        log.info('Continuing without extracted metadata');
    } finally {
        if (squashfsRoot) {
            // Clean up the temporary extraction directory
            const extractDir = join(squashfsRoot, '..');
            await deleteRecursively(extractDir);
        }
    }

    return appImagePath;
}
