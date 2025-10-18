import { $ } from 'bunner/framework';

// Get download URL for a specific asset from latest GitHub release
// repo format: "owner/repo"
// pattern: substring or regex supported by jq's test()
export default async function get_latest_github_release_asset_url(
    repo: string,
    pattern: string,
): Promise<string> {
    if (!repo || !pattern) {
        throw new Error('repo and pattern are required');
    }

    const tmp = await $`mktemp -p /tmp github-release.XXXXXX.json`.text();
    const tmp_path = tmp.trim();

    try {
        await $`curl -s https://api.github.com/repos/${repo}/releases/latest -o ${tmp_path}`;
        const url =
            await $`jq -r ".assets[] | select(.name | test(\"${pattern}\")) | .browser_download_url" ${tmp_path}`.text();
        const trimmed = url.trim();
        if (!trimmed || trimmed === 'null') {
            throw new Error(
                `No asset matching pattern '${pattern}' found in ${repo} latest release`,
            );
        }
        return trimmed;
    } finally {
        await $`rm -f ${tmp_path}`;
    }
}
