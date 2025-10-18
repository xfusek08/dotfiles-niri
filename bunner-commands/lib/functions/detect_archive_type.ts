import { log } from 'bunner/framework';
import { ArchiveType, ArchiveTypes } from 'lib/types/ArchiveType';

/**
 * Detects the archive type from a filename.
 * @param file_name - The filename to check
 * @returns The detected archive type
 * @throws Error if the archive type cannot be detected
 */
export default function detect_archive_type(file_name: string): ArchiveType {
    const lower_file_name = file_name.toLowerCase();

    for (const type of ArchiveTypes) {
        if (lower_file_name.endsWith(`.${type}`)) {
            log.debug(`Detected archive type: .${type} from ${file_name}`);
            return type;
        }
    }

    throw new Error(
        `Could not detect archive type from "${file_name}". Supported types: ${ArchiveTypes.join(', ')}`,
    );
}
