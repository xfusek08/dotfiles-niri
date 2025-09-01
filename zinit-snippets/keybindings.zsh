#!/usr/bin/env zsh
#
# Enhanced ZSH Line Editor (ZLE) Keybindings
# Provides VS Code-like editing experience in ZSH terminal
# Features: Visual selection, smart word navigation, and consistent deletion behavior

# =============================================================================
# CONFIGURATION OPTIONS
# =============================================================================

# Use emacs-style keybindings as the base
bindkey -e

# Define word boundaries (VS Code-like behavior: stop at punctuation/symbols)
WORDCHARS='*?[]~=&;!#$%^(){}<>,"'"'"

# Reduce escape sequence timeout for quicker key response (milliseconds)
: ${KEYTIMEOUT:=5}

# Enable visual selection highlighting
typeset -ga zle_highlight
zle_highlight+=(region:standout)

# =============================================================================
# SELECTION WIDGETS
# =============================================================================

# Select to beginning/end of line
select-to-bol() {
    zle set-mark-command
    zle beginning-of-line
}
zle -N select-to-bol

select-to-eol() {
    zle set-mark-command
    zle end-of-line
}
zle -N select-to-eol

# Select entire buffer (Ctrl+A)
select-all() {
    zle beginning-of-line
    zle set-mark-command
    zle end-of-line
    zle -R  # Force redraw for immediate visual feedback
}
zle -N select-all

# Character-wise selection extension
select-backward-char() {
    (( ! REGION_ACTIVE )) && zle set-mark-command
    zle backward-char
}
zle -N select-backward-char

select-forward-char() {
    (( ! REGION_ACTIVE )) && zle set-mark-command
    zle forward-char
}
zle -N select-forward-char

# Word-wise selection extension
select-backward-word() {
    (( ! REGION_ACTIVE )) && zle set-mark-command
    zle backward-word
}
zle -N select-backward-word

select-forward-word() {
    (( ! REGION_ACTIVE )) && zle set-mark-command
    zle forward-word
}
zle -N select-forward-word

# =============================================================================
# DELETION & EDITING WIDGETS
# =============================================================================

# Delete active selection without affecting kill ring (VS Code behavior)
delete-selection-silent() {
    (( ! REGION_ACTIVE )) && return 1
    
    if (( MARK <= CURSOR )); then
        LBUFFER=${LBUFFER[1, $(( ${#LBUFFER} - (CURSOR - MARK) ))]}
    else
        RBUFFER=${RBUFFER[$(( (MARK - CURSOR) + 1 )), -1]}
    fi
    
    REGION_ACTIVE=0
    return 0
}

# Smart deletion: remove selection or single character
delete-or-kill-region() {
    delete-selection-silent || zle delete-char
}
zle -N delete-or-kill-region

backward-delete-or-kill-region() {
    delete-selection-silent || zle backward-delete-char
}
zle -N backward-delete-or-kill-region

# Typing replaces active selection
insert-or-replace-selection() {
    (( REGION_ACTIVE )) && delete-selection-silent
    zle .self-insert
}
zle -N self-insert insert-or-replace-selection

# Pasting replaces active selection
replace-then-yank() {
    (( REGION_ACTIVE )) && delete-selection-silent
    zle .yank
}
zle -N yank replace-then-yank

replace-then-bracketed-paste() {
    (( REGION_ACTIVE )) && delete-selection-silent
    zle .bracketed-paste
}
zle -N bracketed-paste replace-then-bracketed-paste

# =============================================================================
# KEY BINDINGS
# =============================================================================

# Navigation keys
bindkey $'\e[H'  beginning-of-line       # Home
bindkey $'\e[F'  end-of-line             # End
bindkey $'\eOH'  beginning-of-line       # Alternative Home
bindkey $'\eOF'  end-of-line             # Alternative End
bindkey $'\e[1~' beginning-of-line       # Alternative Home
bindkey $'\e[4~' end-of-line             # Alternative End

# Word navigation (Ctrl+Left/Right)
bindkey $'\e[1;5D' backward-word         # Ctrl+Left
bindkey $'\e[1;5C' forward-word          # Ctrl+Right

# Selection keys
bindkey '^A'       select-all            # Ctrl+A (select all)
bindkey $'\e[1;2H' select-to-bol         # Shift+Home (select to beginning)
bindkey $'\e[1;2F' select-to-eol         # Shift+End (select to end)

# Character-wise selection (Shift+Left/Right)
bindkey $'\e[1;2D' select-backward-char  # Shift+Left
bindkey $'\e[1;2C' select-forward-char   # Shift+Right

# Word-wise selection (Ctrl+Shift+Left/Right)
bindkey $'\e[1;6D' select-backward-word  # Ctrl+Shift+Left
bindkey $'\e[1;6C' select-forward-word   # Ctrl+Shift+Right

# Deletion keys
bindkey $'\e[3~' delete-or-kill-region           # Delete key
bindkey '^?'     backward-delete-or-kill-region  # Backspace
bindkey '^H'     backward-delete-or-kill-region  # Alternative Backspace

# Special deletion (Ctrl+Delete)
bindkey $'\e[3;5~' kill-word              # Ctrl+Delete (delete word right)
