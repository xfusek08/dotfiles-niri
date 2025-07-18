#!/usr/bin/env zsh

# ~~~~~~~~~~~~~~~ Environment ~~~~~~~~~~~~~~~~

export DOTFILES="$HOME/Repo/dotfiles"
export SH_SCRIPTS="$DOTFILES/shell/scripts"
export SH_FUNCTIONS="$DOTFILES/shell/functions"

# ~~~~~~~~~~~~~~~ Path ~~~~~~~~~~~~~~~~
# Inspiration: https://youtu.be/3rCljrDfZ3Y?t=180
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

# ~~~~~~~~~~~~~~~ Basic Shell interaction Plugins ~~~~~~~~~~~~~~~

zinit light zsh-users/zsh-autosuggestions
zinit light zdharma-continuum/fast-syntax-highlighting
zinit light zsh-users/zsh-completions

# ~~~~~~~~~~~~~~~ Shell History & Behavior ~~~~~~~~~~~~~~~

export HISTSIZE=100000
export SAVEHIST=100000
export HISTFILE=~/.zsh_history

setopt SHARE_HISTORY          # Share history between sessions
setopt HIST_IGNORE_ALL_DUPS   # Don't record duplicates
setopt HIST_FIND_NO_DUPS      # Don't show duplicates in search
setopt HIST_REDUCE_BLANKS     # Remove blanks from history items
setopt APPEND_HISTORY         # Append to history file

# # =================================================================
# # ========================= PLUGINS ==============================
# # =================================================================
# # Autosuggestions & syntax highlighting

# zinit light zsh-users/zsh-syntax-highlighting

# zinit light zdharma-continuum/history-search-multi-word

# # =================================================================
# # ====================== DIRECTORY NAVIGATION =====================
# # =================================================================
# # Initialize zoxide
# eval "$(zoxide init --cmd cd zsh)"

# # =================================================================
# # ====================== SHELL BEHAVIOR ===========================
# # =================================================================
# # Basic ZSH Settings
# setopt AUTO_CD              # Change directory without cd
# setopt EXTENDED_GLOB        # Extended globbing
# setopt INTERACTIVE_COMMENTS # Allow comments in interactive shell
# setopt NO_CASE_GLOB         # Case insensitive globbing
# setopt COMPLETE_ALIASES     # Completion for aliases

# # =================================================================
# # ======================= HISTORY MANAGEMENT ======================
# # =================================================================
# # History file configuration
# export HISTSIZE=10000
# export SAVEHIST=10000
# export HISTFILE=~/.zsh_history

# # History behavior
# setopt SHARE_HISTORY          # Share history between sessions
# setopt HIST_IGNORE_ALL_DUPS   # Don't record duplicates
# setopt HIST_FIND_NO_DUPS      # Don't show duplicates in search
# setopt HIST_REDUCE_BLANKS     # Remove blanks from history items
# setopt APPEND_HISTORY         # Append to history file

# # =================================================================
# # ================ CUSTOM SH_SCRIPTS & ALIASES ======================
# # =================================================================
# # Make scripts available as commands without sourcing them
# function _setup_script_aliases() {
#   local scripts_dir="$SH_SCRIPTS"
  
#   # Find all script files recursively
#   for script_path in $(find "$scripts_dir" -type f -name "*.zsh" -o -name "*.sh"); do
#     # Make sure the script is executable
#     chmod +x "$script_path"
    
#     # Get the script name without extension
#     local script_name=$(basename "$script_path" .zsh)
#     script_name=$(basename "$script_name" .sh)
    
#     # Create an alias that runs the script directly
#     alias "$script_name"="$script_path"
#   done
# }

# # Set up script aliases
# _setup_script_aliases

# # =================================================================
# # ==================== COMPLETION SYSTEM =========================
# # =================================================================
# # Add custom completion directory to fpath
# fpath=($DOTFILES/zsh/completions $fpath)

# # Initialize completion system
# autoload -Uz compinit && compinit

# # =================================================================
# # ================== ADDITIONAL CONFIGURATION ====================
# # =================================================================
# # Source additional configuration files
# if [ -d "$DOTFILES/zsh/config" ]; then
#   for config_file in "$DOTFILES/zsh/config"/*.zsh; do
#     source "$config_file"
#   done
# fi

# # Source p10k configuration if it exists
# [[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
