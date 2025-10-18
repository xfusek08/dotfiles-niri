/**
 * Desktop entry file constants
 */
export const DESKTOP_ENTRY_HEADER = '[Desktop Entry]' as const;

/**
 * Archive file extension constants
 */
export const ARCHIVE_EXTENSIONS = {
    ZIP: '.zip',
    TAR_XZ: '.tar.xz',
    TAR_GZ: '.tar.gz',
} as const;

/**
 * Backup file extension
 */
export const BACKUP_FILE_EXTENSION = ARCHIVE_EXTENSIONS.ZIP;
