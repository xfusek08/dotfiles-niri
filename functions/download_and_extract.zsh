source "$SCRIPT_FNS/log.zsh"

# Function to download and extract archive to target directory
# Usage: download_and_extract "url" "target_directory" [archive_type]
# archive_type: auto-detected from URL if not provided (tar.gz, tar.xz, zip)
function download_and_extract() {
    local url="$1"
    local target_directory="$2"
    local archive_type="$3"

    if [[ -z "$url" || -z "$target_directory" ]]; then
        echo "Usage: download_and_extract 'url' 'target_directory' [archive_type]" >&2
        return 1
    fi

    # Auto-detect archive type if not provided
    if [[ -z "$archive_type" ]]; then
        case "$url" in
            *.tar.gz | *.tgz) archive_type="tar.gz" ;;
            *.tar.xz | *.txz) archive_type="tar.xz" ;;
            *.zip) archive_type="zip" ;;
            *)
                echo "Cannot detect archive type from URL: $url" >&2
                return 1
                ;;
        esac
    fi

    # Ensure target directory exists
    ensure_directory "$target_directory"

    # Create temporary file with appropriate extension
    local temp_file
    case "$archive_type" in
        tar.gz) temp_file=$(mktemp "/tmp/archive.XXXXXX.tar.gz") ;;
        tar.xz) temp_file=$(mktemp "/tmp/archive.XXXXXX.tar.xz") ;;
        zip) temp_file=$(mktemp "/tmp/archive.XXXXXX.zip") ;;
        *)
            echo "Unsupported archive type: $archive_type" >&2
            return 1
            ;;
    esac

    # Download archive
    if ! curl -L -o "$temp_file" "$url"; then
        rm -f "$temp_file"
        return 1
    fi

    # Extract to temporary directory first to handle single root directory
    local temp_extract=$(mktemp -d "/tmp/extract.XXXXXX")

    # Extract archive to temporary directory
    case "$archive_type" in
        tar.gz)
            tar -C "$temp_extract" -xzf "$temp_file"
            ;;
        tar.xz)
            tar -C "$temp_extract" -xJf "$temp_file"
            ;;
        zip)
            unzip -q "$temp_file" -d "$temp_extract"
            ;;
    esac

    local extract_result=$?
    rm -f "$temp_file"

    if [[ $extract_result -ne 0 ]]; then
        rm -rf "$temp_extract"
        return $extract_result
    fi

    # Check if there's a single root directory
    local root_dirs=$(find "$temp_extract" -maxdepth 1 -type d -not -path "$temp_extract" | wc -l)
    if [[ $root_dirs -eq 1 ]]; then
        log "Single root directory detected, moving contents to target directory" >&2
        # Move contents from the single root directory
        local extracted_dir=$(find "$temp_extract" -maxdepth 1 -type d -not -path "$temp_extract" | head -n 1)
        # Use cp and rm to avoid glob issues
        cp -r "$extracted_dir"/* "$target_directory/" 2> /dev/null || true
        cp -r "$extracted_dir"/.[^.]* "$target_directory/" 2> /dev/null || true
    else
        log "Multiple root directories detected, moving all contents directly to target directory" >&2
        # Move everything directly
        cp -r "$temp_extract"/* "$target_directory/" 2> /dev/null || true
        cp -r "$temp_extract"/.[^.]* "$target_directory/" 2> /dev/null || true
    fi

    rm -rf "$temp_extract"
    return 0
}
