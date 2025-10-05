import { $ } from 'bunner/framework';

export default async function extract_zip_archive({
    archive_file,
    target_directory,
}: {
    archive_file: string;
    target_directory: string;
}): Promise<void> {
    await $`unzip -q ${archive_file} -d ${target_directory}`;
}
