import { join } from 'node:path';

import ensure_directory from './ensure_directory';

export type ResolveBackupDestinationOptions = {
    base_name: string;
    custom_directory?: string;
    fallback_directory?: string;
    environment_variable?: string;
    suffixes?: string[];
    include_timestamp?: boolean;
};

function build_timestamp(): string {
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
    base_name,
    custom_directory,
    fallback_directory,
    environment_variable,
    suffixes = [],
    include_timestamp = false,
}: ResolveBackupDestinationOptions): Promise<{
    directory: string;
    file_path: string;
}> {
    const env_directory = environment_variable ? process.env[environment_variable] : undefined;
    const candidate_directories = [custom_directory, fallback_directory, env_directory].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
    );

    const directory = candidate_directories[0];

    if (!directory) {
        throw new Error(
            'No backup directory specified. Provide a directory explicitly or configure an environment fallback.',
        );
    }

    await ensure_directory(directory);

    const suffix_list = [...suffixes];
    if (include_timestamp) {
        suffix_list.push(build_timestamp());
    }

    const suffix = suffix_list.length > 0 ? `-${suffix_list.join('-')}` : '';
    const file_path = join(directory, `${base_name}${suffix}.zip`);

    return { directory, file_path };
}
