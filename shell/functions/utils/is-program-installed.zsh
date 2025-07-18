#!/usr/bin/env zsh

# Check if a program is installed
# Usage: is-program-installed PROGRAM_NAME
# Returns: 0 if installed, 1 otherwise

function is-program-installed() {
    local program="$1"
    command -v "$program" &> /dev/null
    return $?
}
