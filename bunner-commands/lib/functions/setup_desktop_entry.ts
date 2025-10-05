import ensure_directory from './ensure_directory';
import create_desktop_entry, {
    type DesktopEntryOptions,
} from './create_desktop_entry';
import log from '../../../vendor/bunner/framework/log';

export type SetupDesktopEntryOptions = {
    directory: string;
    desktop_file: string;
    options: DesktopEntryOptions;
    product_name?: string;
};

export default async function setup_desktop_entry({
    directory,
    desktop_file,
    options,
    product_name,
}: SetupDesktopEntryOptions): Promise<void> {
    const label = product_name ?? 'application';
    log.info(`Creating desktop icon for ${label}`);
    await ensure_directory(directory);
    await create_desktop_entry({
        desktopFile: desktop_file,
        options,
    });
}
