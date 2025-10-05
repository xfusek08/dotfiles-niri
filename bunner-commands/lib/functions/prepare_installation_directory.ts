import directory_has_contents from './directory_has_contents';
import backup_existing_directory, {
    type BackupResult,
} from './backup_existing_directory';
import log from '../../../vendor/bunner/framework/log';

export type PrepareInstallationOptions = {
    directory: string;
    create_backup: () => Promise<string>;
    product_name?: string;
};

export default async function prepare_installation_directory({
    directory,
    create_backup,
    product_name,
}: PrepareInstallationOptions): Promise<BackupResult> {
    const label = product_name ?? 'installation';

    const hasExistingInstallation = await directory_has_contents(directory);

    if (!hasExistingInstallation) {
        log.info(`No existing ${label} found in ${directory}, proceeding.`);
        return { created: false };
    }

    log.info(`Creating backup of existing ${label} in: ${directory}`);

    const result = await backup_existing_directory({
        directory,
        create_backup,
    });

    if (result.output) {
        log.success(`Created backup at: ${result.output}`);
    } else {
        log.success('Backup command completed');
    }

    log.info(`Cleared ${directory}`);
    return result;
}
