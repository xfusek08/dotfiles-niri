#!/usr/bin/env zsh
#
# Enhanced ZSH Line Editor (ZLE) Keybindings
# Provides VS Code-like editing experience with clipboard support
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

# Clipboard command (Wayland)
: ${COPY_CMD:=wl-copy}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Get selected text from buffer
get-selection() {
    if (( !REGION_ACTIVE )); then
        return 1
    fi
    
    local start end
    if (( MARK < CURSOR )); then
        start=$MARK
        end=$CURSOR
    else
        start=$CURSOR
        end=$MARK
    fi
    
    echo -n "${BUFFER[start+1, end]}"
}

# Show notification with formatted text
show-notification() {
    local title="$1"
    local content="$2"
    
    # Format content for notification (HTML entities)
    local formatted_content="${content//&/&amp;}"
    formatted_content="${formatted_content//</&lt;}"
    formatted_content="${formatted_content//>/&gt;}"
    
    # Show notification (silently ignore if notify-send isn't available)
    command -v notify-send >/dev/null 2>&1 && \
    notify-send -t 3000 "$title" "$(printf "%b" "\n<tt>$formatted_content</tt>")" 2>/dev/null
}

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
    # Select the whole multi-line buffer
    MARK=0
    CURSOR=${#BUFFER}
    REGION_ACTIVE=1
    zle -R  # Force redraw for immediate visual feedback
}
zle -N select-all

# Character-wise selection extension
select-backward-char() {
    (( !REGION_ACTIVE )) && zle set-mark-command
    zle backward-char
}
zle -N select-backward-char

select-forward-char() {
    (( !REGION_ACTIVE )) && zle set-mark-command
    zle forward-char
}
zle -N select-forward-char

# Word-wise selection extension
select-backward-word() {
    (( !REGION_ACTIVE )) && zle set-mark-command
    zle backward-word
}
zle -N select-backward-word

select-forward-word() {
    (( !REGION_ACTIVE )) && zle set-mark-command
    zle forward-word
}
zle -N select-forward-word

# =============================================================================
# CLIPBOARD WIDGETS
# =============================================================================

# Copy selection to clipboard (Shift+Ctrl+C)
copy-to-clipboard() {
    local selected_text
    if selected_text=$(get-selection); then
        echo -n "$selected_text" | $COPY_CMD
        show-notification "Copied to clipboard" "$selected_text"
    else
        # If no selection, copy the entire line
        echo -n "$BUFFER" | $COPY_CMD
        show-notification "Copied line to clipboard" "$BUFFER"
    fi
}
zle -N copy-to-clipboard

# Cut selection to clipboard (Shift+Ctrl+X)
cut-to-clipboard() {
    local selected_text
    if selected_text=$(get-selection); then
        echo -n "$selected_text" | $COPY_CMD
        show-notification "Cut to clipboard" "$selected_text"
        delete-selection-silent
    else
        # If no selection, cut the entire line
        echo -n "$BUFFER" | $COPY_CMD
        show-notification "Cut line to clipboard" "$BUFFER"
        zle kill-whole-line
    fi
}
zle -N cut-to-clipboard

# =============================================================================
# DELETION & EDITING WIDGETS
# =============================================================================

# Delete active selection without affecting kill ring (VS Code behavior)
delete-selection-silent() {
    (( !REGION_ACTIVE )) && return 1
    
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
bindkey '^A'     select-all              # Ctrl+A (select all)
bindkey $'\e[1;2H' select-to-bol         # Shift+Home (select to beginning)
bindkey $'\e[1;2F' select-to-eol         # Shift+End (select to end)

# Character-wise selection (Shift+Left/Right)
bindkey $'\e[1;2D' select-backward-char  # Shift+Left
bindkey $'\e[1;2C' select-forward-char   # Shift+Right

# Word-wise selection (Ctrl+Shift+Left/Right)
bindkey $'\e[1;6D' select-backward-word  # Ctrl+Shift+Left
bindkey $'\e[1;6C' select-forward-word   # Ctrl+Shift+Right

# Clipboard operations (Shift+Ctrl+C/X)
# Note: These escape sequences might need adjustment for your terminal
bindkey $'\e[99;6u'  copy-to-clipboard   # Shift+Ctrl+C (Escape + C)
bindkey $'\e[120;6u' cut-to-clipboard    # Shift+Ctrl+X (Escape + X)

# Deletion keys
bindkey $'\e[3~'  delete-or-kill-region           # Delete key
bindkey '^?'      backward-delete-or-kill-region  # Backspace
bindkey '^H'      backward-delete-or-kill-region  # Alternative Backspace

# Special deletion (Ctrl+Delete)
bindkey $'\e[3;5~' kill-word              # Ctrl+Delete (delete word right)
