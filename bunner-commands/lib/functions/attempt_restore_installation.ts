import restore_from_backup from './restore_from_backup';
import log from '../../../vendor/bunner/framework/log';

export type AttemptRestoreOptions = {
    should_restore: boolean;
    restore: () => Promise<string>;
    product_name?: string;
};

export default async function attempt_restore_installation({
    should_restore,
    restore,
    product_name,
}: AttemptRestoreOptions): Promise<void> {
    if (!should_restore) {
        return;
    }

    const label = product_name ?? 'installation';
    log.info(`Attempting to restore previous ${label}`);
    await restore_from_backup(restore);
}
