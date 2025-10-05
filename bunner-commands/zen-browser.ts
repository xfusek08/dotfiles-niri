import { defineCommand, log } from 'bunner/framework';
import { join } from 'node:path';

import { manage_application } from './lib/applications/manage_application';
import type {
    ApplicationDefinition,
    ApplicationPaths,
    UninstallTarget,
} from './lib/applications/types';
import type { DesktopEntryOptions } from './lib/functions/create_desktop_entry';
import { homedir } from 'node:os';

function build_desktop_entry_options(paths: ApplicationPaths): DesktopEntryOptions {
    const exec_path = paths.executable_link;
    if (!exec_path) {
        throw new Error('Executable link path is not defined for the application.');
    }

    return {
        version: '1.0',
        name: 'Zen Browser',
        comment: 'Experience tranquillity while browsing the web without people tracking you!',
        genericName: 'Web Browser',
        keywords: ['Internet', 'WWW', 'Browser', 'Web', 'Explorer'],
        exec: exec_path,
        icon: paths.icon_path,
        terminal: false,
        type: 'Application',
        categories: ['GNOME', 'GTK', 'Network', 'WebBrowser'],
        mimeType: [
            'text/html',
            'text/xml',
            'application/xhtml+xml',
            'application/rss+xml',
            'application/rdf+xml',
            'image/gif',
            'image/jpeg',
            'image/png',
            'x-scheme-handler/http',
            'x-scheme-handler/https',
            'x-scheme-handler/ftp',
            'x-scheme-handler/chrome',
            'video/webm',
            'application/x-xpinstall',
        ],
        startupNotify: true,
        additionalFields: {
            'X-MultipleArgs': 'false',
        },
    };
}

function uninstall_directories(paths: ApplicationPaths): UninstallTarget[] {
    const targets: UninstallTarget[] = [];

    targets.push({
        path: paths.install_directory,
        description: 'Removing Zen installation directory',
    });

    if (paths.cache_directories) {
        for (const cache_dir of paths.cache_directories) {
            targets.push({
                path: cache_dir,
                description: 'Removing Zen cache directory',
            });
        }
    }

    if (paths.profile_directories) {
        for (const profile_dir of paths.profile_directories) {
            const sine_config_path = join(profile_dir, 'chrome/utils');
            targets.push({
                path: sine_config_path,
                description: `Removing Sine configuration from ${profile_dir}`,
            });
        }
    }

    return targets;
}

function uninstall_symlinks(paths: ApplicationPaths): UninstallTarget[] {
    if (!paths.executable_link) {
        return [];
    }
    return [
        {
            path: paths.executable_link,
            description: 'Removing Zen executable link',
        },
    ];
}

function uninstall_files(paths: ApplicationPaths): UninstallTarget[] {
    if (!paths.desktop_file) {
        return [];
    }
    return [
        {
            path: paths.desktop_file,
            description: 'Removing Zen desktop entry',
        },
    ];
}

function uninstall_empty_directories(paths: ApplicationPaths): UninstallTarget[] {
    return [
        {
            path: paths.main_directory,
            description: 'Removing empty Zen configuration directory',
        },
    ];
}

export const zen_browser_definition: ApplicationDefinition = {
    id: 'zen-browser',
    name: 'Zen Browser',
    repo: 'zen-browser/desktop',
    asset_pattern: 'linux-x86_64.tar.xz',
    binary_name: 'Zen executable',
    resolve_paths: (home_directory: string): ApplicationPaths => {
        const main_directory = join(home_directory, '.zen');
        const install_directory = join(main_directory, 'zen');
        const executable_link = join(home_directory, '.local/bin/zen');
        const executable_target = join(install_directory, 'zen');
        const desktop_directory = join(home_directory, '.local/share/applications');
        const desktop_file = join(desktop_directory, 'zen.desktop');
        const icon_path = join(install_directory, 'browser/chrome/icons/default/default128.png');
        const cache_directories = [join(home_directory, '.cache/zen')];
        const profile_directories = [
            join(main_directory, 'zen-browser/profile'),
            join(main_directory, 'profile'),
        ];

        return {
            home_directory,
            main_directory,
            install_directory,
            executable_link,
            executable_target,
            desktop_directory,
            desktop_file,
            icon_path,
            cache_directories,
            profile_directories,
        };
    },
    build_desktop_entry_options,
    backup: {
        default_base_name: 'zen-browser-backup',
        environment_variable: 'SYNCED_BACKUP_DIR',
        exclude_patterns: ['zen/*', '*.tar.gz', '*.zip', '*/storage/**'],
        include_all_suffix: 'complete',
    },
    install: {
        pre_install_backup_name: 'zen-browser-backup-before-installation',
    },
    uninstall: {
        directories: uninstall_directories,
        symlinks: uninstall_symlinks,
        files: uninstall_files,
        empty_directories: uninstall_empty_directories,
    },
};

export default defineCommand({
    command: 'zen-browser',
    description: 'Manage Zen Browser installation, backups, restores, and uninstallation.',
    options: [
        {
            short: 'i',
            long: 'install',
            type: 'boolean',
            description: 'Install or update the application from the latest release.',
        },
        {
            short: 'b',
            long: 'backup',
            type: 'boolean',
            description: 'Create a backup of the application configuration.',
        },
        {
            short: 'r',
            long: 'restore',
            type: 'boolean',
            description:
                'Restore from an existing backup. Provide an optional file path as the first argument.',
        },
        {
            short: 'u',
            long: 'uninstall',
            type: 'boolean',
            description: 'Uninstall the application and clean related files.',
        },
        {
            short: 'a',
            long: 'all',
            type: 'boolean',
            description: 'Include all files in backups (disables default exclusions).',
        },
        {
            short: 't',
            long: 'timestamp',
            type: 'boolean',
            description: 'Append a timestamp to generated backup file names.',
        },
        {
            short: 'f',
            long: 'file-dir',
            type: 'path',
            required: false,
            description: 'Directory where backup files are stored or searched.',
        },
        {
            short: 'n',
            long: 'name',
            type: 'string',
            required: false,
            description: 'Custom base name for backup files.',
        },
    ] as const,
    action: async ({ args, options }) => {
        const selected_modes: Array<'install' | 'backup' | 'restore' | 'uninstall'> = [];

        if (options.install) {
            selected_modes.push('install');
        }
        if (options.backup) {
            selected_modes.push('backup');
        }
        if (options.restore) {
            selected_modes.push('restore');
        }
        if (options.uninstall) {
            selected_modes.push('uninstall');
        }

        if (selected_modes.length === 0) {
            throw new Error(
                'Specify an action: use --install, --backup, --restore, or --uninstall.',
            );
        }

        if (selected_modes.length > 1) {
            throw new Error('Please choose exactly one action at a time.');
        }

        const mode = selected_modes[0];
        const restore_path = args.getString(0);

        log.info(`Executing ${mode} for ${zen_browser_definition.name}`);

        await manage_application(mode, {
            definition: zen_browser_definition,
            paths: zen_browser_definition.resolve_paths(process.env.HOME ?? homedir()),
            include_all: options.all ?? false,
            include_timestamp: options.timestamp ?? false,
            custom_name: options.name,
            custom_directory: options['file-dir'],
            restore_file: restore_path,
        });
    },
});
