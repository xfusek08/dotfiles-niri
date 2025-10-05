import directory_has_contents from './directory_has_contents';
import delete_recursively from './delete_recursively';
import ensure_directory from './ensure_directory';

export type BackupResult = {
    created: boolean;
    output?: string;
};

export default async function backup_existing_directory({
    directory,
    create_backup,
}: {
    directory: string;
    create_backup: () => Promise<string>;
}): Promise<BackupResult> {
    if (!(await directory_has_contents(directory))) {
        return { created: false };
    }

    const rawOutput = await create_backup();
    const trimmedOutput = rawOutput.trim();

    await delete_recursively(directory);
    await ensure_directory(directory);

    return {
        created: true,
        output: trimmedOutput.length > 0 ? trimmedOutput : undefined,
    };
}
