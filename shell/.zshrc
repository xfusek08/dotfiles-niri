#!/usr/bin/env zsh

# ~~~~~~~~~~~~~~~ Performance measurement start ~~~~~~~~~~~~~~~~

# Load the zsh/datetime module for EPOCHREALTIME variable
zmodload zsh/datetime
typeset -F shell_start=$EPOCHREALTIME

# ~~~~~~~~~~~~~~~ Environment ~~~~~~~~~~~~~~~~

export DOTFILES="$HOME/Repo/dotfiles"
export SH_SCRIPTS="$DOTFILES/shell/scripts"
export SH_FUNCTIONS="$DOTFILES/shell/functions"
export ZSH_COMPLETIONS_DIR="$DOTFILES/shell/completions"

# ~~~~~~~~~~~~~~~ Path ~~~~~~~~~~~~~~~~
# https://youtu.be/3rCljrDfZ3Y?t=180
# Sets up the PATH variable without duplicates

path=("${(@s/:/)PATH}")
path+=(
    $HOME/bin
    $HOME/.local/bin
    $SH_SCRIPTS
)
typeset -U path
path=($^path(N-/))
export PATH

# ~~~~~~~~~~~~~~~ Package Management (Zinit) ~~~~~~~~~~~~~~~
# Configuration is based on this video:
# https://www.youtube.com/watch?v=ud7YxC33Z3w

ZINIT_HOME="${XDG_DATA_HOME:-$HOME/.local/share}/zinit/zinit.git"
if [ ! -d $ZINIT_HOME ]; then
    mkdir -p "$(dirname $ZINIT_HOME)"
    git clone https://github.com/zdharma-continuum/zinit.git "$ZINIT_HOME"
fi
source "$ZINIT_HOME/zinit.zsh"

# ~~~~~~~~~~~~~~~ External Shell Mods ~~~~~~~~~~~~~~~

eval "$(zoxide init --cmd cd zsh)"
eval "$(starship init zsh)"
source <(fzf --zsh)

# ~~~~~~~~~~~~~~~ Basic Shell interaction Plugins ~~~~~~~~~~~~~~~

zinit light zsh-users/zsh-autosuggestions
zinit light zdharma-continuum/fast-syntax-highlighting
zinit light zsh-users/zsh-completions

zinit light jirutka/zsh-shift-select
zinit light aloxaf/fzf-tab
zinit snippet OMZP::dirhistory

# ~~~~~~~~~~~~~~~ Shell History & Behavior ~~~~~~~~~~~~~~~

export HISTSIZE=100000
export SAVEHIST=100000
export HISTFILE=~/.zsh_history
export HISTDUP=erase

setopt appendhistory        # append history to the history file
setopt sharehistory         # share history between sessions
setopt hist_ignore_space    # ignore commands starting with a space
setopt hist_ignore_all_dups # ignore duplicate commands
setopt hist_save_no_dups    # do not save duplicate commands
setopt hist_ignore_dups     # ignore duplicate commands
setopt hist_find_no_dups    # do not display duplicate commands

# ~~~~~~~~~~~~~~~ Custom Aliases ~~~~~~~~~~~~~~~

alias ls='eza -lga --icons=auto --color=auto --group-directories-first'
alias lsl='ls -s modified -la'

alias bat="bat --paging=always --italic-text=always --color=always --decorations=always --wrap=never"

# ~~~~~~~~~~~~~~~ Completions ~~~~~~~~~~~~~~~

fpath=($ZSH_COMPLETIONS_DIR $fpath)

autoload -Uz compinit
compinit

zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':completion:*' menu no
zstyle ':fzf-tab:complete:cd:*' fzf-preview 'ls $realpath'

zstyle ':completion:*' verbose yes
zstyle ':completion:*:descriptions' format '%B%d%b'     # Bold descriptions
zstyle ':completion:*:messages' format '%d'             # Normal messages
zstyle ':completion:*:warnings' format 'No matches: %d' # Warnings
zstyle ':completion:*' group-name ''                    # Group options by category

# ~~~~~~~~~~~~~~~ Performance measurement end ~~~~~~~~~~~~~~~~

local taken=$(printf "%.2f" $(( $EPOCHREALTIME - shell_start )))
print -P "%B%F{green}󱐋 Shell loaded in ${taken}s%f%b"
