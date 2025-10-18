import { AppConfig } from './app_manager';
import { ConfigValidationError } from './types';

/**
 * Validates an application configuration object.
 * Throws ConfigValidationError if validation fails.
 *
 * @param config - The application configuration to validate
 * @throws {ConfigValidationError} If any validation check fails
 */
export function validateAppConfig(config: AppConfig): void {
    // Validate ID
    if (!config.id || config.id.trim().length === 0) {
        throw new ConfigValidationError('App ID cannot be empty', 'id');
    }

    // Validate name
    if (!config.name || config.name.trim().length === 0) {
        throw new ConfigValidationError('App name cannot be empty', 'name');
    }

    // Validate repository format (should be "owner/repo")
    if (!config.repository || !config.repository.includes('/')) {
        throw new ConfigValidationError('Repository must be in format "owner/repo"', 'repository');
    }

    const repoParts = config.repository.split('/');
    if (repoParts.length !== 2 || repoParts[0].length === 0 || repoParts[1].length === 0) {
        throw new ConfigValidationError(
            'Repository must be in format "owner/repo" with non-empty owner and repo',
            'repository',
        );
    }

    // Validate asset pattern
    if (!config.assetPattern || config.assetPattern.trim().length === 0) {
        throw new ConfigValidationError('Asset pattern cannot be empty', 'assetPattern');
    }

    // Validate paths
    if (!config.paths.mainDirectory) {
        throw new ConfigValidationError(
            'Main directory path cannot be empty',
            'paths.mainDirectory',
        );
    }

    if (!config.paths.installDirectory) {
        throw new ConfigValidationError(
            'Install directory path cannot be empty',
            'paths.installDirectory',
        );
    }

    if (!config.paths.executableLink) {
        throw new ConfigValidationError(
            'Executable link path cannot be empty',
            'paths.executableLink',
        );
    }

    if (!config.paths.executableTarget) {
        throw new ConfigValidationError(
            'Executable target path cannot be empty',
            'paths.executableTarget',
        );
    }

    if (!config.paths.desktopFile) {
        throw new ConfigValidationError('Desktop file path cannot be empty', 'paths.desktopFile');
    }

    if (!config.paths.iconPath) {
        throw new ConfigValidationError('Icon path cannot be empty', 'paths.iconPath');
    }

    // Validate backup configuration
    if (!config.backup.defaultBaseName || config.backup.defaultBaseName.trim().length === 0) {
        throw new ConfigValidationError(
            'Default backup base name cannot be empty',
            'backup.defaultBaseName',
        );
    }

    if (
        !config.backup.preInstallBackupName ||
        config.backup.preInstallBackupName.trim().length === 0
    ) {
        throw new ConfigValidationError(
            'Pre-install backup name cannot be empty',
            'backup.preInstallBackupName',
        );
    }

    // Validate desktop entry
    if (!config.desktopEntry.name || config.desktopEntry.name.trim().length === 0) {
        throw new ConfigValidationError('Desktop entry name cannot be empty', 'desktopEntry.name');
    }

    if (!config.desktopEntry.exec || config.desktopEntry.exec.trim().length === 0) {
        throw new ConfigValidationError('Desktop entry exec cannot be empty', 'desktopEntry.exec');
    }
}
