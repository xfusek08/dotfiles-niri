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

/**
 * AppImage installation paths
 */
export const APPIMAGE_PATHS = {
    BASE_DIR: '~/.local/appimages',
    BIN_DIR: '~/.local/bin',
    APPLICATIONS_DIR: '~/.local/share/applications',
} as const;
