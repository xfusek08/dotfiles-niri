#!/usr/bin/env zsh

source "$SCRIPT_FNS/log.zsh"

function run-bunner() {
    local command_directory=$(realpath "$SCRIPTS/../bunner-commands")
    local bunner_run_script=$(realpath "$SCRIPTS/../bunner/run")
    $bunner_run_script "$command_directory" "$@"
}
