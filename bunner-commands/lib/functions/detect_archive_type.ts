import { ArchiveType, ArchiveTypes } from 'lib/types/ArchiveType';

export default function detect_archive_type(file_name: string): ArchiveType {
    for (const type of ArchiveTypes) {
        if (file_name.toLowerCase().endsWith(`.${type}`)) {
            return type;
        }
    }
    throw new Error(
        `Cannot detect archive type from URL: ${file_name}. Supported types: ${ArchiveTypes.join(', ')}`,
    );
}
