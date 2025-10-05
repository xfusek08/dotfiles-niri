import install_from_github_release from './install_from_github_release';
import directory_has_contents from './directory_has_contents';
import log from '../../../vendor/bunner/framework/log';

export type InstallReleaseOptions = {
    repo: string;
    asset_pattern: string;
    install_dir: string;
    product_name?: string;
};

export default async function install_release_from_github({
    repo,
    asset_pattern,
    install_dir,
    product_name,
}: InstallReleaseOptions): Promise<void> {
    const label = product_name ?? 'application';

    log.info(`Downloading and extracting latest ${label} release`);
    await install_from_github_release({
        repo,
        asset_pattern,
        install_dir,
    });

    const hasContents = await directory_has_contents(install_dir);
    if (!hasContents) {
        throw new Error(
            `${label} extraction produced an empty installation directory`,
        );
    }

    log.success('Extraction completed');
}
