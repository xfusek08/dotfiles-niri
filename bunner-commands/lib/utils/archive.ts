import { $ } from 'bunner/framework';
import { log } from 'bunner/framework';
import { readdir, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { isDirectory, ensureDirectory, deleteRecursively, isDirectoryNonEmpty } from './fileSystem';
import { createTemporaryFile, createTemporaryDirectory } from './temporary';

/**
 * Archive type constants
 */
export const ARCHIVE_TYPES = ['tar.gz', 'tar.xz', 'zip'] as const;
export type ArchiveType = (typeof ARCHIVE_TYPES)[number];

/**
 * Detects the archive type from a filename.
 *
 * @param fileName - The filename to check
 * @returns The detected archive type
 * @throws Error if the archive type cannot be detected
 */
export function detectArchiveType(fileName: string): ArchiveType {
    const lowerFileName = fileName.toLowerCase();

    for (const type of ARCHIVE_TYPES) {
        if (lowerFileName.endsWith(`.${type}`)) {
            log.debug(`Detected archive type: .${type} from ${fileName}`);
            return type;
        }
    }

    throw new Error(
        `Could not detect archive type from "${fileName}". Supported types: ${ARCHIVE_TYPES.join(', ')}`,
    );
}

/**
 * Extracts an archive to the specified directory.
 *
 * @param archivePath - Path to the archive file
 * @param outputDirectory - Directory to extract to
 */
export async function extractArchive({
    archivePath,
    outputDirectory,
}: {
    archivePath: string;
    outputDirectory: string;
}): Promise<void> {
    const archiveType = detectArchiveType(archivePath);
    log.debug(`Extracting archive of type: ${archivePath} --> ${archiveType}`);

    switch (archiveType) {
        case 'tar.gz':
            await $`tar -xzf ${archivePath} -C ${outputDirectory}`;
            break;
        case 'tar.xz':
            await $`tar -xJf ${archivePath} -C ${outputDirectory}`;
            break;
        case 'zip':
            await $`unzip -q ${archivePath} -d ${outputDirectory}`;
            break;
    }
}

/**
 * Creates a ZIP archive from a source directory.
 *
 * @param sourceDirectory - The directory to archive
 * @param outputFile - Path for the output ZIP file
 * @param excludePatterns - Optional array of patterns to exclude (glob patterns for zip -x)
 */
export async function createZipArchive({
    sourceDirectory,
    outputFile,
    excludePatterns = [],
}: {
    sourceDirectory: string;
    outputFile: string;
    excludePatterns?: string[];
}): Promise<void> {
    const hasContent = await isDirectoryNonEmpty(sourceDirectory);

    if (!hasContent && excludePatterns.length === 0) {
        log.warn(`No ZIP archive created for ${sourceDirectory} because the directory is empty.`);
        return;
    }

    const excludeArgs = excludePatterns.flatMap((pattern) => ['-x', pattern]);
    await $`cd ${sourceDirectory} && zip -qr ${outputFile} . ${excludeArgs}`;
}

/**
 * Downloads a file from a URL.
 *
 * @param url - The URL to download from
 * @param outputPath - Path to save the downloaded file
 */
export async function downloadFile({
    url,
    outputPath,
}: {
    url: string;
    outputPath: string;
}): Promise<void> {
    await $`curl -L ${url} -o ${outputPath}`;
}

/**
 * Downloads and extracts an archive to a target directory.
 * Handles archives with single root directories intelligently.
 *
 * @param archiveUrl - URL of the archive to download
 * @param targetDirectory - Directory to extract the archive contents to
 */
export async function downloadAndExtractArchive({
    archiveUrl,
    targetDirectory,
}: {
    archiveUrl: string;
    targetDirectory: string;
}): Promise<void> {
    const toDelete: string[] = [];
    try {
        log.info(`Preparing to download and extract archive`);
        await ensureDirectory(targetDirectory);
        log.debug(`Target directory ensured: ${targetDirectory}`);

        const archiveType = detectArchiveType(archiveUrl);
        log.debug(`Detected archive type: ${archiveType}`);

        const temporaryArchiveFilename = await createTemporaryFile(`archive.XXXXXX.${archiveType}`);

        toDelete.push(temporaryArchiveFilename);
        log.debug(`Temporary archive file created: ${temporaryArchiveFilename}`);

        log.info(`Downloading archive: ${archiveUrl}`);
        await downloadFile({
            url: archiveUrl,
            outputPath: temporaryArchiveFilename,
        });
        log.success(`Archive downloaded`);

        const temporaryExtractDir = await createTemporaryDirectory('extract.XXXXXX');

        toDelete.push(temporaryExtractDir);
        log.debug(`Temporary extract directory created: ${temporaryExtractDir}`);

        log.info(`Extracting archive: ${temporaryArchiveFilename} ...`);
        await extractArchive({
            archivePath: temporaryArchiveFilename,
            outputDirectory: temporaryExtractDir,
        });
        log.success(`Archive ${temporaryArchiveFilename} extracted.`);

        const entries = await readdir(temporaryExtractDir);

        const hasRootDirectory =
            entries.length === 1 && (await isDirectory(join(temporaryExtractDir, entries[0])));

        if (hasRootDirectory) {
            const singleRoot = join(temporaryExtractDir, entries[0]);
            log.info(`Single root directory detected, moving its contents`);
            const rootEntries = await readdir(singleRoot, {
                withFileTypes: true,
            });

            for (const entry of rootEntries) {
                const src = join(singleRoot, entry.name);
                const dest = join(targetDirectory, entry.name);
                await cp(src, dest, { recursive: true, force: true });
            }
        } else {
            log.info(`Multiple root entries detected, moving all contents`);
            const rootEntries = await readdir(temporaryExtractDir, {
                withFileTypes: true,
            });
            for (const entry of rootEntries) {
                const src = join(temporaryExtractDir, entry.name);
                const dest = join(targetDirectory, entry.name);
                await cp(src, dest, { recursive: true, force: true });
            }
        }

        log.success(`Archive downloaded and extracted to: ${targetDirectory}`);
    } finally {
        if (toDelete.length > 0) {
            log.debug(`Cleaning up temporary files (${toDelete.length})`);
        }
        for (const file of toDelete) {
            log.debug(`Removing: ${file}`);
            await deleteRecursively(file);
        }
    }
}
