import { log } from 'bunner/framework';
import { ArchiveType, ArchiveTypes } from 'lib/types/ArchiveType';

export default function detect_archive_type(file_name: string): ArchiveType {
    for (const type of ArchiveTypes) {
        log.debug(`Checking for archive type: .${type}`);
        if (file_name.toLowerCase().endsWith(`.${type}`)) {
            return type;
        } else {
            log.debug(
                `File name ${file_name.toLowerCase()} does not match archive type: .${type}`,
            );
        }
    }
    throw new Error(
        `Cannot detect archive type from URL: ${file_name}. Supported types: ${ArchiveTypes.join(', ')}`,
    );
}
