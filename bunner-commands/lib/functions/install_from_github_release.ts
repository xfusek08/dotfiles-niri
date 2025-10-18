import ensure_directory from './ensure_directory';
import get_latest_github_release_asset_url from './get_latest_github_release_asset_url';
import download_and_extract_archive from './download_and_extract_archive';
import log from '../../../vendor/bunner/framework/log';

export default async function install_from_github_release({
    repo,
    asset_pattern,
    install_dir,
}: {
    repo: string; // e.g. "zen-browser/desktop"
    asset_pattern: string; // e.g. "linux-x86_64.tar.xz"
    install_dir: string; // e.g. "~/.zen"
}): Promise<void> {
    await ensure_directory(install_dir);

    log.info(`Fetching latest release asset for ${repo} matching pattern: ${asset_pattern}`);
    const archive_url = await get_latest_github_release_asset_url(repo, asset_pattern);
    log.success(`Resolved asset URL: ${archive_url}`);

    await download_and_extract_archive({
        archive_url,
        target_directory: install_dir,
    });
}
