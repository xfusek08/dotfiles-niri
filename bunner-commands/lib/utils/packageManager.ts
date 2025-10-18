import { $ } from 'bun';
import { log } from 'bunner/framework';

/**
 * Check if a package is installed using pacman
 */
async function isPackageInstalled(packageName: string): Promise<boolean> {
    try {
        log.debug(`Checking if package is installed: ${packageName}`);
        const result = await $`pacman -Q ${packageName}`.quiet();
        return result.exitCode === 0;
    } catch {
        return false;
    }
}

/**
 * Check if all packages are installed, if not, print installation command and exit
 */
export async function ensurePackagesInstalled(packages: string[]): Promise<void> {
    if (packages.length === 0) {
        return;
    }

    log.info('Checking package dependencies...');

    const missingPackages: string[] = [];

    for (const pkg of packages) {
        if (!(await isPackageInstalled(pkg))) {
            missingPackages.push(pkg);
        }
    }

    if (missingPackages.length > 0) {
        log.error(`Missing required packages: ${missingPackages.join(', ')}`);
        log.info('Please install them using:');
        log.info(`  paru -S ${missingPackages.join(' ')}`);
        process.exit(1);
    }

    log.success('All required packages are installed');
}
