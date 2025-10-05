import { defineCommand, log } from 'bunner/framework';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';

import delete_recursively from './lib/functions/delete_recursively';
import is_directory from './lib/functions/is_directory';
import path_exists from './lib/functions/path_exists';
import is_symlink from './lib/functions/is_symlink';
import directory_is_empty from './lib/functions/directory_is_empty';

export default defineCommand({
    command: 'zen-browser-uninstall',
    description:
        'Remove Zen Browser installation, configuration, and related shortcuts.',
    action: async () => {
        const homeDirectory = process.env.HOME ?? homedir();
        const mainDirectory = join(homeDirectory, '.zen');
        const installDirectory = join(mainDirectory, 'zen');
        const localBinZen = join(homeDirectory, '.local/bin/zen');
        const desktopEntry = join(
            homeDirectory,
            '.local/share/applications/zen.desktop',
        );
        const cacheDirectory = join(homeDirectory, '.cache/zen');

        if (await is_directory(installDirectory)) {
            log.info('Removing Zen installation directory');
            await delete_recursively(installDirectory);
        }

        if (await is_symlink(localBinZen)) {
            log.info('Removing Zen executable link');
            await rm(localBinZen, { force: true });
        }

        if (await path_exists(desktopEntry)) {
            log.info('Removing Zen desktop entry');
            await rm(desktopEntry, { force: true });
        }

        if (await is_directory(cacheDirectory)) {
            log.info('Removing Zen cache directory');
            await delete_recursively(cacheDirectory);
        }

        log.info('Checking for Sine related files');
        const profileDirectories = [
            join(mainDirectory, 'zen-browser/profile'),
            join(mainDirectory, 'profile'),
        ];

        for (const profileDir of profileDirectories) {
            const sineConfigPath = join(profileDir, 'chrome/utils');
            if (await is_directory(sineConfigPath)) {
                log.info(`Removing Sine configuration from ${profileDir}`);
                await delete_recursively(sineConfigPath);
            }
        }

        if (
            (await is_directory(mainDirectory)) &&
            (await directory_is_empty(mainDirectory))
        ) {
            log.info('Removing empty Zen configuration directory');
            await delete_recursively(mainDirectory);
        }

        log.success('Zen uninstallation completed');
    },
});
