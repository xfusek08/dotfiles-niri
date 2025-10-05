import ensure_directory from './ensure_directory';
import ensure_symlink from './ensure_symlink';
import log from '../../../vendor/bunner/framework/log';

export type RegisterExecutableOptions = {
    directory: string;
    link_path: string;
    target_path: string;
    binary_name?: string;
};

export default async function register_executable_link({
    directory,
    link_path,
    target_path,
    binary_name,
}: RegisterExecutableOptions): Promise<void> {
    const label = binary_name ?? 'executable';
    log.info(`Registering ${label}`);
    await ensure_directory(directory);
    await ensure_symlink(target_path, link_path);
}
