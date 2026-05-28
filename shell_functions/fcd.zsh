#
# Function:
#     fcd (Fuzzy Change Directory)
#
# Description:
#     This function provides a way to change the current directory
#     or navigate to a file's location using an interactive fuzzy finder.
#
# Usage:
#     fcd [OPTIONS] [DIRECTORY]
#
# Dependencies:
#     - bfs (for directory traversal)
#     - fzf (for fuzzy finding)
#     - preview_file (for file preview functionality)
#
# Options:
#     -h        Show this help message
#     -a        Include hidden directories in the search
#     -p        Print the selected directory instead of changing to it
#     -v        Verbose mode - print additional information
#
# Directory:
#     The directory to search in. Default is the current directory.
#
# Examples:
#     fcd ~/projects/myproject
#     fcd -a ~/projects/myproject
#     fcd -p  # print selected directory without changing to it
#     fcd -v  # show verbose output
#
# Notes:
#     This script requires the following dependencies: bfs, fzf, preview_file
#
# Author:
#     Petr Fusek: petr.fusek97@gmail.com
#
# Thanks to:
#     - The developers of `fzf` and `bat` for creating great tools.
#         - https://github.com/junegunn/fzf
#     - Chat GPT for helping me document this script! 🤖
#

function fcd() {
    # Parse options and arguments
    local all=false
    local prt=false
    local help=false
    local verbose=false
    local searchDirectory

    # Add logging function
    function log() {
        local level="$1"
        shift
        if [[ $level = "DEBUG" && $verbose != "true" ]]; then
            return
        fi
        printf "[%s] %s\n" $level "$@" >&2
    }

    # Parse options using zsh's zparseopts
    local -A opts
    zparseopts -D -A opts -- \
        h=help -help=help \
        a=all -all=all \
        p=print -print=print \
        v=verbose -verbose=verbose

    # Handle options
    [[ -n "${help}" ]] && help=true
    [[ -n "${all}" ]] && all=true
    [[ -n "${print}" ]] && prt=true
    [[ -n "${verbose}" ]] && verbose=true

    # Get the directory to search in from the first argument
    searchDirectory="${1:-$PWD}"

    # Show help message if -h option is specified
    if [[ $help == "true" ]]; then
        echo -e "$(
            cat << EOF
\033[1mUsage:\033[0m fcd [OPTIONS] [DIRECTORY]

Changes the current directory to the specified directory or to a directory selected interactively using \033[1;36mfzf\033[0m.

\033[1mOptions:\033[0m
    \033[1m-h\033[0m        Show this help message
    \033[1m-a\033[0m        Include hidden directories in the search
    \033[1m-p\033[0m        Print the selected directory instead of changing to it
    \033[1m-v\033[0m        Verbose mode - print additional information

\033[1mDirectory:\033[0m
    The directory to search for subdirectories in. Default is the current directory.

\033[1mExamples:\033[0m
    fcd \033[33m~/projects/myproject\033[0m
    fcd -a \033[33m~/projects/myproject\033[0m
    fcd -p  \033[33m# print selected directory without changing to it\033[0m
    fcd -v  \033[33m# show verbose output\033[0m

\033[1mNote:\033[0m
This script requires the following dependencies:
    - \033[1;36mbfs\033[0m (for directory traversal)
    - \033[1;36mfzf\033[0m (for fuzzy finding)
    - \033[1;36mpreview_file\033[0m (for file preview)

Please make sure to install these dependencies before using the script.
EOF
        )"
        return 0
    fi

    # Set bfs arguments based on all flag
    local bfs_args=""
    [[ $all == "false" ]] && bfs_args="-nohidden"

    # Use the preview script directly without sourcing
    local findResult="$(
        bfs "$searchDirectory" $bfs_args \
            | fzf --preview "fzf-preview {}"
    )"

    # If no result found (user cancelled), return quietly
    [[ -z "$findResult" ]] && return 0

    log "DEBUG" "Extracting directory from findResult: $findResult"

    if [[ -f $findResult ]]; then
        findResult=$(dirname "$findResult")
    fi

    log "DEBUG" "Will navigate to $findResult"

    # Print the selected directory if -p option is specified
    if [[ $prt == "true" ]]; then
        print -r -- "$findResult"
    else
        log "DEBUG" "Changing directory to: $findResult"
        cd "$findResult"
    fi
}
