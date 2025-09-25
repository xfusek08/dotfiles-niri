import { $, log, defineCommand } from 'bunner/framework';
import BunnerError from 'bunner/framework/types/BunnerError';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

export default defineCommand({
    command: 'dae',
    description:
        'Download And Extract - Downloads an archive and extracts it into the target directory. Archive type auto-detected from URL unless --type is provided.',
    options: [
        {
            short: 't',
            long: 'type',
            type: 'string',
            description: 'Archive type: tar.gz | tar.xz | zip',
            required: false,
        },
    ] as const,
    action: async ({ args, options }) => {
        const [url] = args.popFirstArg();
        const [targetDirectory] = args.popFirstArg();
        const typeOpt = (options as unknown as { type?: string }).type;

        if (!url || !targetDirectory) {
            throw new BunnerError(
                "Usage: dae '<url>' '<target_directory>' [--type tar.gz|tar.xz|zip]",
                1,
            );
        }

        const archiveType = detect_archive_type(url, typeOpt);

        try {
            await downloadAndExtract(url, targetDirectory, archiveType);
            log.success('Done');
        } catch (err) {
            throw new BunnerError(`download-and-extract failed: ${err}`, 1);
        }
    },
});

function detect_archive_type(url: string, explicit?: string): ArchiveType {
    if (explicit === 'tar.gz' || explicit === 'tar.xz' || explicit === 'zip') {
        return explicit;
    }
    const lower = url.toLowerCase();
    if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) return 'tar.gz';
    if (lower.endsWith('.tar.xz') || lower.endsWith('.txz')) return 'tar.xz';
    if (lower.endsWith('.zip')) return 'zip';
    throw new Error(
        `Cannot detect archive type from URL and --type not provided: ${url}`,
    );
}

async function ensureDirectory(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

function makeTempFilePath(ext: string): string {
    const rand = Math.random().toString(36).slice(2);
    return path.join(os.tmpdir(), `archive-${Date.now()}-${rand}.${ext}`);
}

async function copyDirContents(srcDir: string, destDir: string) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        // includes dotfiles by default
        const from = path.join(srcDir, entry.name);
        const to = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            await fs.mkdir(to, { recursive: true });
            await copyDirContents(from, to);
        } else if (entry.isSymbolicLink()) {
            const link = await fs.readlink(from);
            try {
                await fs.symlink(link, to);
            } catch {
                // On overwrite conflicts, remove and retry
                await fs.rm(to, { force: true, recursive: true });
                await fs.symlink(link, to);
            }
        } else {
            await fs.copyFile(from, to);
        }
    }
}

async function downloadAndExtract({
    url,
    targetDirectory,
    archiveType,
}: {
    url: string;
    targetDirectory: string;
    archiveType: ArchiveType;
}) {
    await ensureDirectory(targetDirectory);

    const tempFile =
        archiveType === 'tar.gz'
            ? makeTempFilePath('tar.gz')
            : archiveType === 'tar.xz'
              ? makeTempFilePath('tar.xz')
              : makeTempFilePath('zip');

    const tempExtract = await fs.mkdtemp(path.join(os.tmpdir(), 'extract-'));

    try {
        log.info(`Downloading ${url}`);
        await $`curl -fsSL -o ${tempFile} ${url}`;

        log.info(`Extracting as ${archiveType}`);
        if (archiveType === 'tar.gz') {
            await $`tar -C ${tempExtract} -xzf ${tempFile}`;
        } else if (archiveType === 'tar.xz') {
            await $`tar -C ${tempExtract} -xJf ${tempFile}`;
        } else {
            await $`unzip -q ${tempFile} -d ${tempExtract}`;
        }

        // Determine if there is a single root directory
        const topEntries = await fs.readdir(tempExtract, {
            withFileTypes: true,
        });
        const rootDirs = topEntries.filter((e) => e.isDirectory());
        if (rootDirs.length === 1) {
            log.info(
                'Single root directory detected, moving contents to target directory',
            );
            const extractedDir = path.join(tempExtract, rootDirs[0].name);
            await copyDirContents(extractedDir, targetDirectory);
        } else {
            log.info(
                'Multiple root items detected, moving all contents directly to target directory',
            );
            await copyDirContents(tempExtract, targetDirectory);
        }
    } finally {
        // Cleanup temporary resources
        await fs.rm(tempFile, { force: true }).catch(() => {});
        await fs
            .rm(tempExtract, { recursive: true, force: true })
            .catch(() => {});
    }
}
