import ensure_directory from './ensure_directory';
import extract_archive from './extract_archive';

export type RestoreBackupArchiveOptions = {
    archive_path: string;
    target_directory: string;
};

export default async function restore_backup_archive({
    archive_path,
    target_directory,
}: RestoreBackupArchiveOptions): Promise<void> {
    await ensure_directory(target_directory);
    await extract_archive({
        archive_path,
        output_directory: target_directory,
    });
}
