# =============================================================================
# Zsh Init Extra Configuration
# =============================================================================
# Loaded after .zshrc by Home Manager
# =============================================================================

# ~~~~~~~~~~~~~~~ Autoload Functions ~~~~~~~~~~~~~~~

# Add shell_functions/ dir to fpath so zsh knows where to find functions
fpath=("${XDG_CONFIG_HOME:-$HOME/.config}/zsh/functions" $fpath)

# Autoload every file in that directory as a lazy-loaded function.
# Breakdown: $fpath[1] is our directory, /* globs all entries inside,
# (.:t) is a glob qualifier: . matches only regular files,
# :t extracts just the filename (the function name).
# So this picks up every file and tells zsh "lazy-load this as a function".
autoload -Uz $fpath[1]/*(.:t)

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

# ~~~~~~~~~~~~~~~ Performance measurement end ~~~~~~~~~~~~~~~

local taken=$(printf "%.2f" $(( $EPOCHREALTIME - shell_start )))
print -P "%B%F{green}󱐋 Shell loaded in ${taken}s%f%b"
