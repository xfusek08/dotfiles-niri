import { defineCommand, log } from 'bunner/framework';

import { tagStudioConfig } from './lib/configs/tagstudio';
import { orchestrateInstallation } from './lib/utils/installationOrchestrator';
import { ensurePackagesInstalled } from './lib/utils/packageManager';

export default defineCommand({
    command: 'tagstudio-install',
    description: 'Installs TagStudio using GitHub release archives.',
    action: async () => {
        log.info('Starting TagStudio installation');

        // Check dependencies
        await ensurePackagesInstalled([
            'dbus',
            'ffmpeg',
            'gcc-libs',
            'libva',
            'libvdpau',
            'libx11',
            'libxcb',
            'libxkbcommon',
            'libxrandr',
            'pipewire',
            'qt6-base',
            'qt6-multimedia',
            'qt6-wayland',
            'unrar',
            'ripgrep',
        ]);

        // Proceed with installation
        const result = await orchestrateInstallation(tagStudioConfig);

        if (result.success) {
            log.success('TagStudio installation finished');
            log.info('You can now run TagStudio using the "tagstudio" command');
        } else {
            log.error('Installation failed');
            throw result.error;
        }
    },
});
