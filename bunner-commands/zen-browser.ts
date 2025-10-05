import { defineCommand, log } from 'bunner/framework';
import { join } from 'node:path';

import { manageApplication } from './lib/applications/manage_application';
import type {
    ApplicationDefinition,
    ApplicationPaths,
    UninstallTarget,
} from './lib/applications/types';
import type { DesktopEntryOptions } from './lib/functions/create_desktop_entry';

function buildDesktopEntryOptions(
    paths: ApplicationPaths,
): DesktopEntryOptions {
    const execPath = paths.executableLink;
    if (!execPath) {
        throw new Error(
            'Executable link path is not defined for the application.',
        );
    }

    return {
        version: '1.0',
        name: 'Zen Browser',
        comment:
            'Experience tranquillity while browsing the web without people tracking you!',
        genericName: 'Web Browser',
        keywords: ['Internet', 'WWW', 'Browser', 'Web', 'Explorer'],
        exec: execPath,
        icon: paths.iconPath,
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

function uninstallDirectories(paths: ApplicationPaths): UninstallTarget[] {
    const targets: UninstallTarget[] = [];

    targets.push({
        path: paths.installDirectory,
        description: 'Removing Zen installation directory',
    });

    if (paths.cacheDirectories) {
        for (const cacheDir of paths.cacheDirectories) {
            targets.push({
                path: cacheDir,
                description: 'Removing Zen cache directory',
            });
        }
    }

    if (paths.profileDirectories) {
        for (const profileDir of paths.profileDirectories) {
            const sineConfigPath = join(profileDir, 'chrome/utils');
            targets.push({
                path: sineConfigPath,
                description: `Removing Sine configuration from ${profileDir}`,
            });
        }
    }

    return targets;
}

function uninstallSymlinks(paths: ApplicationPaths): UninstallTarget[] {
    if (!paths.executableLink) {
        return [];
    }
    return [
        {
            path: paths.executableLink,
            description: 'Removing Zen executable link',
        },
    ];
}

function uninstallFiles(paths: ApplicationPaths): UninstallTarget[] {
    if (!paths.desktopFile) {
        return [];
    }
    return [
        {
            path: paths.desktopFile,
            description: 'Removing Zen desktop entry',
        },
    ];
}

function uninstallEmptyDirectories(paths: ApplicationPaths): UninstallTarget[] {
    return [
        {
            path: paths.mainDirectory,
            description: 'Removing empty Zen configuration directory',
        },
    ];
}

export const zenBrowserDefinition: ApplicationDefinition = {
    id: 'zen-browser',
    name: 'Zen Browser',
    repo: 'zen-browser/desktop',
    assetPattern: 'linux-x86_64.tar.xz',
    binaryName: 'Zen executable',
    resolvePaths: (homeDirectory: string): ApplicationPaths => {
        const mainDirectory = join(homeDirectory, '.zen');
        const installDirectory = join(mainDirectory, 'zen');
        const executableLink = join(homeDirectory, '.local/bin/zen');
        const executableTarget = join(installDirectory, 'zen');
        const desktopDirectory = join(
            homeDirectory,
            '.local/share/applications',
        );
        const desktopFile = join(desktopDirectory, 'zen.desktop');
        const iconPath = join(
            installDirectory,
            'browser/chrome/icons/default/default128.png',
        );
        const cacheDirectories = [join(homeDirectory, '.cache/zen')];
        const profileDirectories = [
            join(mainDirectory, 'zen-browser/profile'),
            join(mainDirectory, 'profile'),
        ];

        return {
            homeDirectory,
            mainDirectory,
            installDirectory,
            executableLink,
            executableTarget,
            desktopDirectory,
            desktopFile,
            iconPath,
            cacheDirectories,
            profileDirectories,
        };
    },
    buildDesktopEntryOptions,
    backup: {
        defaultBaseName: 'zen-browser-backup',
        environmentVariable: 'SYNCED_BACKUP_DIR',
        excludePatterns: ['zen/*', '*.tar.gz', '*.zip', '*/storage/**'],
        includeAllSuffix: 'complete',
    },
    install: {
        preInstallBackupName: 'zen-browser-backup-before-installation',
    },
    uninstall: {
        directories: uninstallDirectories,
        symlinks: uninstallSymlinks,
        files: uninstallFiles,
        emptyDirectories: uninstallEmptyDirectories,
    },
};

export default defineCommand({
    command: 'zen-browser',
    description:
        'Manage Zen Browser installation, backups, restores, and uninstallation.',
    options: [
        {
            short: 'i',
            long: 'install',
            type: 'boolean',
            description:
                'Install or update the application from the latest release.',
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
            description:
                'Include all files in backups (disables default exclusions).',
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
        const selectedModes: Array<
            'install' | 'backup' | 'restore' | 'uninstall'
        > = [];

        if (options.install) {
            selectedModes.push('install');
        }
        if (options.backup) {
            selectedModes.push('backup');
        }
        if (options.restore) {
            selectedModes.push('restore');
        }
        if (options.uninstall) {
            selectedModes.push('uninstall');
        }

        if (selectedModes.length === 0) {
            throw new Error(
                'Specify an action: use --install, --backup, --restore, or --uninstall.',
            );
        }

        if (selectedModes.length > 1) {
            throw new Error('Please choose exactly one action at a time.');
        }

        const mode = selectedModes[0];
        const restorePath = args.getString(0);

        log.info(`Executing ${mode} for ${zenBrowserDefinition.name}`);

        await manageApplication(zenBrowserDefinition, {
            mode,
            includeAll: options.all ?? false,
            includeTimestamp: options.timestamp ?? false,
            customName: options.name,
            customDirectory: options['file-dir'],
            restoreFile: restorePath,
        });
    },
});
