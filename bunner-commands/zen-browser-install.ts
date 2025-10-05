import { defineCommand, $ } from 'bunner/framework';
import { homedir } from 'node:os';
import { join } from 'node:path';
import ensure_directory from './lib/functions/ensure_directory';
import prepare_installation_directory from './lib/functions/prepare_installation_directory';
import install_release_from_github from './lib/functions/install_release_from_github';
import register_executable_link from './lib/functions/register_executable_link';
import setup_desktop_entry from './lib/functions/setup_desktop_entry';
import attempt_restore_installation from './lib/functions/attempt_restore_installation';
import { DesktopEntryOptions } from './lib/functions/create_desktop_entry';
import log from '../vendor/bunner/framework/log';

const ZEN_REPO = 'zen-browser/desktop';
const ZEN_ASSET_PATTERN = 'linux-x86_64.tar.xz';
const BACKUP_NAME = 'zen-browser-backup-before-installation';

function buildDesktopEntryOptions(
    exec: string,
    icon: string,
): DesktopEntryOptions {
    return {
        version: '1.0',
        name: 'Zen Browser',
        comment:
            'Experience tranquillity while browsing the web without people tracking you!',
        genericName: 'Web Browser',
        keywords: ['Internet', 'WWW', 'Browser', 'Web', 'Explorer'],
        exec,
        icon,
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

export default defineCommand({
    command: 'zen-browser-install',
    description:
        'Install or update the Zen Browser from the latest GitHub release',
    action: async () => {
        const homeDirectory = process.env.HOME ?? homedir();
        const mainDirectory = join(homeDirectory, '.zen');
        const installDirectory = join(mainDirectory, 'zen');
        const localBinDirectory = join(homeDirectory, '.local/bin');
        const desktopDirectory = join(
            homeDirectory,
            '.local/share/applications',
        );
        const desktopFile = join(desktopDirectory, 'zen.desktop');
        const executableLink = join(localBinDirectory, 'zen');
        const executableTarget = join(installDirectory, 'zen');
        const iconPath = join(
            installDirectory,
            'browser/chrome/icons/default/default128.png',
        );

        log.info('Preparing directories');
        await ensure_directory(mainDirectory);
        await ensure_directory(installDirectory);

        const backupResult = await prepare_installation_directory({
            directory: installDirectory,
            create_backup: () =>
                $`zen-browser-backup -t -n ${BACKUP_NAME}`.text(),
            product_name: 'Zen installation',
        });

        try {
            await install_release_from_github({
                repo: ZEN_REPO,
                asset_pattern: ZEN_ASSET_PATTERN,
                install_dir: installDirectory,
                product_name: 'Zen Browser',
            });

            await register_executable_link({
                directory: localBinDirectory,
                link_path: executableLink,
                target_path: executableTarget,
                binary_name: 'Zen executable',
            });

            await setup_desktop_entry({
                directory: desktopDirectory,
                desktop_file: desktopFile,
                options: buildDesktopEntryOptions(executableLink, iconPath),
                product_name: 'Zen Browser',
            });

            log.success('Zen installation process completed');
        } catch (error) {
            log.error((error as Error).message);
            await attempt_restore_installation({
                should_restore: backupResult.created,
                restore: () => $`zen-browser-backup -r`.text(),
                product_name: 'Zen installation',
            });
            throw error;
        }
    },
});
