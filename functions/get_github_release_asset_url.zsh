#!/usr/bin/env zsh

# Function to get download URL for a specific asset from latest GitHub release
# Usage: get_github_release_asset_url "owner/repo" "asset_name_pattern"
# Returns: URL via stdout, empty string on error
function get_github_release_asset_url() {
    local repo="$1"
    local pattern="$2"

    if [[ -z "$repo" || -z "$pattern" ]]; then
        return 1
    fi

    # Download latest release info (via gh)
    local temp_json=$(mktemp "/tmp/github-release.XXXXXX.json")
    gh api "repos/$repo/releases/latest" > "$temp_json"

    if [[ $? -ne 0 ]] || [[ ! -s "$temp_json" ]]; then
        rm -f "$temp_json"
        return 1
    fi

    # Extract asset URL using regex pattern
    local asset_url=$(cat "$temp_json" | jq -r ".assets[] | select(.name | test(\"${pattern}\")) | .browser_download_url")

    rm -f "$temp_json"

    if [[ -z "$asset_url" || "$asset_url" == "null" ]]; then
        return 1
    fi

    echo "$asset_url"
    return 0
}
