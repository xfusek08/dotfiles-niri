#!/usr/bin/env zsh

# Centralized ZLE keybindings and widgets

# Use emacs-style bindings unless overridden
bindkey -e

# VS Code-like word boundaries (stop at punctuation, slash, dot, dash, underscore)
WORDCHARS=$'*?[]~=&;!#$%^(){}<>,"\''

# Optionally reduce escape-sequence wait to make combos feel snappier (50ms)
: ${KEYTIMEOUT:=5}

# Visual selection highlight for the active region
typeset -ga zle_highlight
zle_highlight+=(region:standout)

# Widgets to select to beginning/end of line
select-to-bol() { zle set-mark-command; zle beginning-of-line }
zle -N select-to-bol
select-to-eol() { zle set-mark-command; zle end-of-line }
zle -N select-to-eol

# Explicit keybindings
bindkey $'\e[H'    beginning-of-line  # Home
bindkey $'\e[F'    end-of-line        # End
bindkey $'\e[1;5D' backward-word      # Ctrl+Left
bindkey $'\e[1;5C' forward-word       # Ctrl+Right
bindkey $'\e[1;2H' select-to-bol      # Shift+Home (select to BOL)
bindkey $'\e[1;2F' select-to-eol      # Shift+End (select to EOL)

# Delete/Backspace should remove selection when region is active
# Make deletion not affect the kill ring (VS Code behavior)
delete-selection-silent() {
    if (( ! REGION_ACTIVE )); then
        return 1
    fi
    local n
    if (( MARK <= CURSOR )); then
        n=$(( CURSOR - MARK ))
        LBUFFER=${LBUFFER[1, ${#LBUFFER}-n]}
    else
        n=$(( MARK - CURSOR ))
        RBUFFER=${RBUFFER[n+1, -1]}
    fi
    REGION_ACTIVE=0
    return 0
}

delete-or-kill-region() {
    if delete-selection-silent; then
        return
    fi
    zle delete-char
}
zle -N delete-or-kill-region

backward-delete-or-kill-region() {
    if delete-selection-silent; then
        return
    fi
    zle backward-delete-char
}
zle -N backward-delete-or-kill-region

bindkey $'\e[3~' delete-or-kill-region      # Delete
bindkey '^?'      backward-delete-or-kill-region  # Backspace
bindkey '^H'      backward-delete-or-kill-region  # Backspace fallback (^H)

# Typing replaces the active selection (without filling kill ring)
insert-or-replace-selection() {
    (( REGION_ACTIVE )) && delete-selection-silent
    zle .self-insert
}
zle -N self-insert insert-or-replace-selection

# Pasting/yanking also replaces the active selection (VS Code behavior)
replace-then-yank() { (( REGION_ACTIVE )) && delete-selection-silent; zle .yank }
zle -N yank replace-then-yank
replace-then-bracketed-paste() { (( REGION_ACTIVE )) && delete-selection-silent; zle .bracketed-paste }
zle -N bracketed-paste replace-then-bracketed-paste

# Shift+Left/Right extend selection by char; Ctrl+Shift+Left/Right by word
select-backward-char() { (( ! REGION_ACTIVE )) && zle set-mark-command; zle backward-char }
zle -N select-backward-char
select-forward-char()  { (( ! REGION_ACTIVE )) && zle set-mark-command; zle forward-char }
zle -N select-forward-char
select-backward-word() { (( ! REGION_ACTIVE )) && zle set-mark-command; zle backward-word }
zle -N select-backward-word
select-forward-word()  { (( ! REGION_ACTIVE )) && zle set-mark-command; zle forward-word }
zle -N select-forward-word

# Common xterm sequences for Shift/Ctrl+Shift arrows
bindkey $'\e[1;2D' select-backward-char   # Shift+Left
bindkey $'\e[1;2C' select-forward-char    # Shift+Right
bindkey $'\e[1;6D' select-backward-word   # Ctrl+Shift+Left
bindkey $'\e[1;6C' select-forward-word    # Ctrl+Shift+Right

# Extra portability: alternative Home/End sequences
bindkey $'\eOH' beginning-of-line
bindkey $'\eOF' end-of-line
bindkey $'\e[1~' beginning-of-line
bindkey $'\e[4~' end-of-line

# Ctrl+Delete (common in VS Code to delete word to the right)
bindkey $'\e[3;5~' kill-word
