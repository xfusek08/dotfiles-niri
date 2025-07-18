#!/usr/bin/env zsh

source "$SH_FUNCTIONS/log.zsh"

function run-bunner() {
    local command_directory=$(realpath "$SH_SCRIPTS/../bunner-commands")
    local bunner_run_script=$(realpath "$SH_SCRIPTS/../bunner/run")
    $bunner_run_script "$command_directory" "$@"
}
