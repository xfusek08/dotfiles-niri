import { $ } from 'bunner/framework';

export default async function create_zip_archive({
    source_directory,
    output_file,
    exclude_patterns = [],
}: {
    source_directory: string;
    output_file: string;
    exclude_patterns?: string[];
}): Promise<void> {
    const exclude_args = exclude_patterns.flatMap((pattern) => ['-x', pattern]);

    await $`cd ${source_directory} && zip -qr ${output_file} . ${exclude_args}`;
}
