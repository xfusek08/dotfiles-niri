import type { DesktopEntryOptions } from '../functions/create_desktop_entry';

export type ApplicationPaths = {
    homeDirectory: string;
    mainDirectory: string;
    installDirectory: string;
    executableLink?: string;
    executableTarget?: string;
    desktopDirectory?: string;
    desktopFile?: string;
    iconPath?: string;
    cacheDirectories?: string[];
    profileDirectories?: string[];
};

export type ApplicationBackupConfig = {
    defaultBaseName: string;
    environmentVariable?: string;
    fallbackDirectory?: (paths: ApplicationPaths) => string | undefined;
    excludePatterns?: string[];
    includeAllSuffix?: string;
};

export type ApplicationInstallConfig = {
    preInstallBackupName?: string;
};

export type UninstallTarget = {
    path: string;
    description?: string;
};

export type ApplicationUninstallConfig = {
    directories?: (paths: ApplicationPaths) => UninstallTarget[];
    symlinks?: (paths: ApplicationPaths) => UninstallTarget[];
    files?: (paths: ApplicationPaths) => UninstallTarget[];
    emptyDirectories?: (paths: ApplicationPaths) => UninstallTarget[];
    extraSteps?: (paths: ApplicationPaths) => Promise<void>;
};

export type ApplicationDefinition = {
    id: string;
    name: string;
    repo: string;
    assetPattern: string;
    resolvePaths: (homeDirectory: string) => ApplicationPaths;
    buildDesktopEntryOptions?: (
        paths: ApplicationPaths,
    ) => DesktopEntryOptions | undefined;
    backup: ApplicationBackupConfig;
    install?: ApplicationInstallConfig;
    uninstall?: ApplicationUninstallConfig;
    binaryName?: string;
};
