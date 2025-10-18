import detect_archive_type from './detect_archive_type';
import ensure_directory from './ensure_directory';
import download_file from './download_file';
import delete_recursively from './delete_recursively';
import create_temporary_directory from './create_temporary_directory';
import extract_archive from './extract_archive';
import create_temporary_file from './create_temporary_file';
import { cp, readdir } from 'node:fs/promises';
import is_directory from './is_directory';
import { join } from 'node:path';
import log from '../../../vendor/bunner/framework/log';

export default async function download_and_extract_archive({
    archive_url,
    target_directory,
}: {
    archive_url: string;
    target_directory: string;
}): Promise<void> {
    const to_delete: string[] = [];
    try {
        log.info(`Preparing to download and extract archive`);
        await ensure_directory(target_directory);
        log.debug(`Target directory ensured: ${target_directory}`);

        const archive_type = detect_archive_type(archive_url);
        log.debug(`Detected archive type: ${archive_type}`);

        const temporary_archive_filename = await create_temporary_file(
            `archive.XXXXXX.${archive_type}`,
        );

        to_delete.push(temporary_archive_filename);
        log.debug(`Temporary archive file created: ${temporary_archive_filename}`);

        log.info(`Downloading archive: ${archive_url}`);
        await download_file({
            url: archive_url,
            outputPath: temporary_archive_filename,
        });
        log.success(`Archive downloaded`);

        const temporary_extract_dir = await create_temporary_directory('extract.XXXXXX');

        to_delete.push(temporary_extract_dir);
        log.debug(`Temporary extract directory created: ${temporary_extract_dir}`);

        log.info(`Extracting archive: ${temporary_archive_filename} ...`);
        await extract_archive({
            archive_path: temporary_archive_filename,
            output_directory: temporary_extract_dir,
        });
        log.success(`Archive ${temporary_archive_filename} extracted.`);

        const entries = await readdir(temporary_extract_dir);

        const has_root_directory =
            entries.length === 1 && (await is_directory(join(temporary_extract_dir, entries[0])));

        if (has_root_directory) {
            const single_root = join(temporary_extract_dir, entries[0]);
            log.info(`Single root directory detected, moving its contents`);
            const root_entries = await readdir(single_root, {
                withFileTypes: true,
            });

            for (const entry of root_entries) {
                const src = join(single_root, entry.name);
                const dest = join(target_directory, entry.name);
                await cp(src, dest, { recursive: true, force: true });
            }
        } else {
            log.info(`Multiple root entries detected, moving all contents`);
            const root_entries = await readdir(temporary_extract_dir, {
                withFileTypes: true,
            });
            for (const entry of root_entries) {
                const src = join(temporary_extract_dir, entry.name);
                const dest = join(target_directory, entry.name);
                await cp(src, dest, { recursive: true, force: true });
            }
        }

        log.success(`Archive downloaded and extracted to: ${target_directory}`);
    } finally {
        if (to_delete.length > 0) {
            log.debug(`Cleaning up temporary files (${to_delete.length})`);
        }
        for (const file of to_delete) {
            log.debug(`Removing: ${file}`);
            await delete_recursively(file);
        }
    }
}
