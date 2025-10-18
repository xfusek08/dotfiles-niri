import { AppConfig } from '../utils/app_manager';

export const tagSpacesConfig: AppConfig = {
    id: 'tagspaces',
    name: 'TagSpaces',
    repository: 'tagspaces/tagspaces',
    assetPattern: 'linux-x86_64.*AppImage',
    isAppImage: true,
    paths: {
        mainDirectory: '$HOME/.local/appimages/tagspaces',
        installDirectory: '$HOME/.local/appimages/tagspaces/app',
        executableLink: '$HOME/.local/bin/tagspaces',
        executableTarget: '$HOME/.local/appimages/tagspaces/app/tagspaces.AppImage',
        desktopFile: '$HOME/.local/share/applications/tagspaces.desktop',
        iconPath: '$HOME/.local/appimages/tagspaces/app/tagspaces.png',
        cacheDirectories: ['$HOME/.cache/tagspaces'],
        profileDirectories: ['$HOME/.config/TagSpaces'],
    },
    backup: {
        defaultBaseName: 'tagspaces-backup',
        preInstallBackupName: 'tagspaces-backup-before-installation',
        environmentVariable: 'SYNCED_BACKUP_DIR',
        excludePatterns: ['app/*', '*.AppImage', '*.tar.gz', '*.zip'],
        includeAllSuffix: 'complete',
    },
    desktopEntry: {
        version: '1.0',
        name: 'TagSpaces',
        comment: 'Open source file organizer and manager',
        genericName: 'File Manager',
        keywords: ['Files', 'Tags', 'Organizer', 'Manager', 'Notes'],
        exec: '$HOME/.local/bin/tagspaces',
        terminal: false,
        type: 'Application',
        icon: '$HOME/.local/appimages/tagspaces/app/tagspaces.png',
        categories: ['Utility', 'FileManager', 'Office'],
        mimeType: ['inode/directory', 'application/json'],
        startupNotify: true,
        additionalFields: {
            'X-MultipleArgs': 'false',
        },
    },
};
