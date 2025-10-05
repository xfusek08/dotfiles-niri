import ensure_directory from '../ensure_directory';
import extract_archive from '../extract_archive';

export type RestoreBackupArchiveOptions = {
    archivePath: string;
    targetDirectory: string;
};

export default async function restore_backup_archive({
    archivePath,
    targetDirectory,
}: RestoreBackupArchiveOptions): Promise<void> {
    await ensure_directory(targetDirectory);

    await extract_archive({
        archive_path: archivePath,
        output_directory: targetDirectory,
    });
}
