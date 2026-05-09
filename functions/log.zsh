#!/usr/bin/env zsh

# Simple logging utility with colored output
# Usage: log [-i|-w|-e|-s] [-f <file>] "message"
# Options:
#   -i: info (default, blue)
#   -w: warning (yellow)
#   -e: error (red)
#   -s: success (green)
#   -f <file>: append plain (no color) output to file instead of stderr

function log() {
    local OPTIND=1
    local color_reset="\033[0m"
    local color_blue="\033[0;34m"
    local color_red="\033[0;31m"
    local color_yellow="\033[0;33m"
    local color_green="\033[0;32m"

    local type="INFO"
    local color="$color_blue"
    local output_file=""

    # Process options
    while getopts "iwesf:" opt; do
        case "$opt" in
            i)
                type="INFO"
                color="$color_blue"
                ;;
            w)
                type="WARNING"
                color="$color_yellow"
                ;;
            e)
                type="ERROR"
                color="$color_red"
                ;;
            s)
                type="SUCCESS"
                color="$color_green"
                ;;
            f)
                output_file="$OPTARG"
                ;;
        esac
    done

    shift $((OPTIND - 1))
    local message="$1"
    local timestamp=$(date +"%d. %m. %Y %H:%M:%S")

    if [[ -n "$output_file" ]]; then
        echo "[$timestamp] [$type] ${message}" >> "$output_file"
    else
        echo -e "[$timestamp] ${color}[$type] ${message}${color_reset}" >&2
    fi
}
