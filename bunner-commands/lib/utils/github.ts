import { $ } from 'bunner/framework';

/**
 * Gets the download URL for a specific asset from the latest GitHub release.
 *
 * @param repo - Repository in format "owner/repo"
 * @param pattern - Substring or regex pattern supported by jq's test() to match asset name
 * @returns The browser download URL for the matching asset
 * @throws Error if repo or pattern is empty, or if no matching asset is found
 *
 * @example
 * ```typescript
 * const url = await getLatestGithubReleaseAssetUrl(
 *   'zen-browser/desktop',
 *   'linux-x86_64.tar.xz'
 * );
 * ```
 */
export async function getLatestGithubReleaseAssetUrl(
    repo: string,
    pattern: string,
): Promise<string> {
    if (!repo || !pattern) {
        throw new Error('repo and pattern are required');
    }

    const tmp = await $`mktemp -p /tmp github-release.XXXXXX.json`.text();
    const tmpPath = tmp.trim();

    try {
        await $`curl -s https://api.github.com/repos/${repo}/releases/latest -o ${tmpPath}`;
        const url =
            await $`jq -r ".assets[] | select(.name | test(\"${pattern}\")) | .browser_download_url" ${tmpPath}`.text();
        const trimmed = url.trim();
        if (!trimmed || trimmed === 'null') {
            throw new Error(
                `No asset matching pattern '${pattern}' found in ${repo} latest release`,
            );
        }
        return trimmed;
    } finally {
        await $`rm -f ${tmpPath}`;
    }
}
