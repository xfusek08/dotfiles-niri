import { defineCommand, log } from 'bunner/framework';

import { getLatestGithubReleaseAssetUrl } from './lib/utils/github';
import { installAppImage } from './lib/utils/appimage';

export default defineCommand({
    command: 'tagspaces-install',
    description: 'Installs TagSpaces using GitHub release AppImage.',
    action: async () => {
        log.info('Starting TagSpaces installation');

        const appImageUrl = await getLatestGithubReleaseAssetUrl(
            'tagspaces/tagspaces',
            'linux-x86_64.*AppImage',
        );

        await installAppImage({
            appName: 'tagspaces',
            appImageSource: appImageUrl,
        });

        log.success('TagSpaces installation finished');
    },
});
