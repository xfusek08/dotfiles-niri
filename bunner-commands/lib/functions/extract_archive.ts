import { $ } from 'bun';
import detect_archive_type from './detect_archive_type';

export default function extract_archive({
    archive_path,
    output_directory,
}: {
    archive_path: string;
    output_directory: string;
}) {
    const archive_type = detect_archive_type(archive_path);

    switch (archive_type) {
        case 'tar.gz':
            return $`tar -xzf ${archive_path} -C ${output_directory}`;
        case 'tar.xz':
            return $`tar -xJf ${archive_path} -C ${output_directory}`;
        case 'zip':
            return $`unzip -q ${archive_path} -d ${output_directory}`;
    }
}
