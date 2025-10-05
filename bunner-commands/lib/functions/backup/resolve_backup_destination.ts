import { join } from 'node:path';

import ensure_directory from '../ensure_directory';

export type ResolveBackupDestinationOptions = {
    baseName: string;
    customDirectory?: string;
    fallbackDirectory?: string;
    environmentVariable?: string;
    suffixes?: string[];
    includeTimestamp?: boolean;
};

function buildTimestamp(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    return [
        `${now.getFullYear()}`,
        pad(now.getMonth() + 1),
        pad(now.getDate()),
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds()),
    ].join(':');
}

export default async function resolve_backup_destination({
    baseName,
    customDirectory,
    fallbackDirectory,
    environmentVariable,
    suffixes = [],
    includeTimestamp = false,
}: ResolveBackupDestinationOptions): Promise<{
    directory: string;
    filePath: string;
}> {
    const envDirectory = environmentVariable
        ? process.env[environmentVariable]
        : undefined;
    const candidateDirectories = [
        customDirectory,
        fallbackDirectory,
        envDirectory,
    ].filter(
        (value): value is string =>
            typeof value === 'string' && value.length > 0,
    );

    const directory = candidateDirectories[0];

    if (!directory) {
        throw new Error(
            'No backup directory specified. Provide a directory explicitly or configure an environment fallback.',
        );
    }

    await ensure_directory(directory);

    const suffixList = [...suffixes];
    if (includeTimestamp) {
        suffixList.push(buildTimestamp());
    }

    const suffix = suffixList.length > 0 ? `-${suffixList.join('-')}` : '';
    const filePath = join(directory, `${baseName}${suffix}.zip`);

    return { directory, filePath };
}
