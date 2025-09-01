#!/usr/bin/env zsh

set -u

# Capture interactive zsh key bindings (from your normal .zshrc environment)
get_bindings_dump() {
    # Only keep lines that start with 'bindkey ' to avoid any noise from .zshrc
    zsh -i -c 'bindkey -L' 2>/dev/null | sed -n 's/^[[:space:]]*bindkey /bindkey /p'
}

# Convert raw bytes to caret-notation as used by `bindkey -L` (e.g. ^[[1;5C)
to_caret_notation() {
    local str="$1" out="" char code
    local LC_ALL=C
    local i
    for ((i=1; i<=${#str}; i++)); do
        char=${str[i]}
        code=$(printf '%d' "'$char")
        if (( code == 27 )); then
            out+="^["
            elif (( code == 127 )); then
            out+="^?"
            elif (( code >= 0 && code < 32 )); then
            # Control chars: ^@, ^A, ...
            out+="^"
            if (( code == 0 )); then
                out+="@"
            else
                out+=$(printf "\\x%02X" $((code+64)) | xxd -r -p)
            fi
        else
            out+="$char"
        fi
    done
    print -r -- "$out"
}

# Convert raw bytes to $'...' inner content (with escapes like \e, \n, \xHH)
to_dollar_single_inner() {
    local str="$1"
    local -a parts=()
    local LC_ALL=C
    local i char code hex
    
    for ((i=1; i<=${#str}; i++)); do
        char=${str[i]}
        code=$(printf '%d' "'$char")
        case $code in
            27) parts+=($'\\' "e") ;;     # \e
            9)  parts+=($'\\' "t") ;;     # \t
            10) parts+=($'\\' "n") ;;     # \n
            13) parts+=($'\\' "r") ;;     # \r
            *)
                if (( code < 32 || code >= 127 )); then
                    printf -v hex '%02X' "$code"
                    parts+=($'\\' "x${hex}")
                else
                    case "$char" in
                        "\\") parts+=($'\\') ;;          # backslash
                        "'")  parts+=($'\\' "'") ;;      # \' (two chars: backslash, then quote)
                        *)    parts+=("$char") ;;
                    esac
                fi
            ;;
        esac
    done
    
    # Join without separators
    local inner
    inner="${(j::)parts}"
    print -r -- "$inner"
}

# Read one key (possibly a multi-byte escape sequence) using a short timeout merge
read_key() {
    local ch key
    # First byte (block until one byte available)
    if ! IFS= read -r -k 1 ch; then
        return 1
    fi
    key=$ch
    # Slurp any immediately following bytes (part of the same escape sequence)
    while IFS= read -r -t 0.03 -k 1 ch; do
        key+=$ch
    done
    print -r -- "$key"
}

# Find the widget bound to a caret-notation sequence by scanning the bindkey dump
find_widget_for_caret() {
    local caret="$1" dump="$2" line widget
    line=$(printf '%s\n' "$dump" | grep -F -- "'$caret'" | head -n1)
    if [[ -n "$line" ]]; then
        widget=${${(z)line}[-1]}   # last word
        print -r -- "$widget"
        return 0
    fi
    return 1
}

main() {
    # Fetch one-time snapshot of bindings from your interactive zsh
    local BINDINGS_DUMP
    BINDINGS_DUMP="$(get_bindings_dump)"
    
    # Put terminal into raw-ish mode
    local orig_stty
    orig_stty=$(stty -g)
    trap 'stty "$orig_stty"; echo; exit' INT TERM EXIT
    stty -echo -icanon time 1 min 0
    
    print -r -- "Press keys (Ctrl+C to exit)."
    
    while true; do
        local seq key caret inner widget
        key=$(read_key) || continue
        caret=$(to_caret_notation "$key")
        inner=$(to_dollar_single_inner "$key")
        
        if ! widget=$(find_widget_for_caret "$caret" "$BINDINGS_DUMP"); then
            widget="<widget>"
        fi
        
        # Print: bindkey $'\e[1;5C' widget
        printf "bindkey \$'%s' %s\n" "$inner" "$widget"
    done
}

main "$@"
