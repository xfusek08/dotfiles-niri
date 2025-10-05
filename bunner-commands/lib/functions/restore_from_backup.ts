import log from '../../../vendor/bunner/framework/log';

export default async function restore_from_backup(
    restore: () => Promise<string | void>,
): Promise<void> {
    const output = await restore()
        .then((raw) => (typeof raw === 'string' ? raw.trim() : undefined))
        .catch((error: Error) => {
            log.error(`Failed to restore from backup: ${error.message}`);
            return null;
        });

    if (output === null) {
        return;
    }

    if (output && output.length > 0) {
        log.success(`Successfully restored from backup: ${output}`);
    } else {
        log.success('Restore command completed');
    }
}
