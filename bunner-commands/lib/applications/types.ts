import type { DesktopEntryOptions } from '../functions/create_desktop_entry';

export type ApplicationPaths = {
    home_directory: string;
    main_directory: string;
    install_directory: string;
    executable_link: string;
    executable_target: string;
    desktop_directory: string;
    desktop_file: string;
    icon_path: string;
};

export type ApplicationBackupConfig = {
    default_base_name: string;
    environment_variable?: string;
    exclude_patterns?: string[];
    include_all_suffix?: string;
};

export type ApplicationInstallConfig = {
    pre_install_backup_name?: string;
};

export type UninstallTarget = {
    path: string;
    description?: string;
};

export type ApplicationUninstallConfig = {
    directories?: (paths: ApplicationPaths) => UninstallTarget[];
    symlinks?: (paths: ApplicationPaths) => UninstallTarget[];
    files?: (paths: ApplicationPaths) => UninstallTarget[];
    empty_directories?: (paths: ApplicationPaths) => UninstallTarget[];
    extra_steps?: (paths: ApplicationPaths) => Promise<void>;
};

export type ApplicationDefinition = {
    id: string;
    name: string;
    repo: string;
    asset_pattern: string;
    resolve_paths: (home_directory: string) => ApplicationPaths;
    build_desktop_entry_options?: (paths: ApplicationPaths) => DesktopEntryOptions | undefined;
    backup: ApplicationBackupConfig;
    install?: ApplicationInstallConfig;
    uninstall?: ApplicationUninstallConfig;
    binary_name?: string;
};
