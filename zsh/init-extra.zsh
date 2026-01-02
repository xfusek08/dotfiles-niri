# =============================================================================
# Zsh Init Extra Configuration
# =============================================================================
# Loaded after .zshrc by Home Manager
# =============================================================================

# ~~~~~~~~~~~~~~~ Zinit Setup ~~~~~~~~~~~~~~~

ZINIT_HOME="${XDG_DATA_HOME:-$HOME/.local/share}/zinit/zinit.git"
if [ ! -d "$ZINIT_HOME" ]; then
    mkdir -p "$(dirname $ZINIT_HOME)"
    git clone https://github.com/zdharma-continuum/zinit.git "$ZINIT_HOME"
fi
source "$ZINIT_HOME/zinit.zsh"

# Fix conflicting aliases
zinit ice atload'unalias zi 2>/dev/null'

# ~~~~~~~~~~~~~~~ Zinit Plugins ~~~~~~~~~~~~~~~

zinit light zsh-users/zsh-completions
zinit light jirutka/zsh-shift-select
zinit light aloxaf/fzf-tab
zinit snippet OMZP::dirhistory

# ~~~~~~~~~~~~~~~ Completion Styling ~~~~~~~~~~~~~~~

zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':completion:*' menu no
zstyle ':fzf-tab:complete:cd:*' fzf-preview 'eza -la --icons=auto --color=always $realpath'
zstyle ':fzf-tab:complete:z:*' fzf-preview 'eza -la --icons=auto --color=always $realpath'
zstyle ':completion:*' verbose yes
zstyle ':completion:*:descriptions' format '%B%d%b'
zstyle ':completion:*:messages' format '%d'
zstyle ':completion:*:warnings' format 'No matches: %d'
zstyle ':completion:*' group-name ""

# ~~~~~~~~~~~~~~~ Keybindings ~~~~~~~~~~~~~~~

# Ctrl+Left/Right for word navigation
bindkey '^[[1;5D' backward-word
bindkey '^[[1;5C' forward-word

# Home/End keys
bindkey '^[[H' beginning-of-line
bindkey '^[[F' end-of-line
bindkey '^[[1~' beginning-of-line
bindkey '^[[4~' end-of-line

# Delete key
bindkey '^[[3~' delete-char

# Ctrl+Backspace/Delete for word deletion
bindkey '^H' backward-kill-word
bindkey '^[[3;5~' kill-word

# ~~~~~~~~~~~~~~~ Yazi Shell Wrapper ~~~~~~~~~~~~~~~

# Change to directory when exiting yazi
function y() {
    local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
    yazi "$@" --cwd-file="$tmp"
    if cwd="$(cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
        builtin cd -- "$cwd"
    fi
    rm -f -- "$tmp"
}

# ~~~~~~~~~~~~~~~ Fuzzy Change Directory ~~~~~~~~~~~~~~~

# fcd - fuzzy find and change to directory
# Usage: fcd [OPTIONS] [DIRECTORY]
# Options: -h help, -a include hidden, -p print only, -v verbose
function fcd() {
    local all=false
    local prt=false
    local help=false
    local verbose=false
    local searchDirectory

    function log() {
        local level="$1"
        shift
        if [[ $level = "DEBUG" && $verbose != "true" ]]; then
            return
        fi
        printf "[%s] %s\n" $level "$@" >&2
    }

    local -A opts
    zparseopts -D -A opts -- \
        h=help -help=help \
        a=all -all=all \
        p=print -print=print \
        v=verbose -verbose=verbose

    [[ -n "${help}" ]] && help=true
    [[ -n "${all}" ]] && all=true
    [[ -n "${print}" ]] && prt=true
    [[ -n "${verbose}" ]] && verbose=true

    searchDirectory="${1:-$PWD}"

    if [[ $help == "true" ]]; then
        cat << 'EOF'
Usage: fcd [OPTIONS] [DIRECTORY]

Changes directory interactively using fzf.

Options:
    -h        Show this help message
    -a        Include hidden directories in the search
    -p        Print the selected directory instead of changing to it
    -v        Verbose mode - print additional information

Examples:
    fcd ~/projects
    fcd -a ~/projects
    fcd -p
EOF
        return 0
    fi

    local bfs_args=""
    [[ $all == "false" ]] && bfs_args="-nohidden"

    local findResult="$(
        bfs "$searchDirectory" $bfs_args \
            | fzf --preview "eza -la --icons=auto --color=always {}"
    )"

    [[ -z "$findResult" ]] && return 0

    log "DEBUG" "Extracting directory from findResult: $findResult"

    if [[ -f $findResult ]]; then
        findResult=$(dirname "$findResult")
    fi

    log "DEBUG" "Will navigate to $findResult"

    if [[ $prt == "true" ]]; then
        print -r -- "$findResult"
    else
        log "DEBUG" "Changing directory to: $findResult"
        cd "$findResult"
    fi
}

# ~~~~~~~~~~~~~~~ Performance measurement end ~~~~~~~~~~~~~~~

local taken=$(printf "%.2f" $(( $EPOCHREALTIME - shell_start )))
print -P "%B%F{green}󱐋 Shell loaded in ${taken}s%f%b"
