#!/usr/bin/env zsh

function run_bash_tpl() {
    local from_file_or_dir="$1"
    local to_file_or_dir="$2"

    # Bash has to be installed
    if ! command -v bash &> /dev/null; then
        echo "Error: 'bash' is not installed. Please install it first."
        return 1
    fi

    # check if RUN_TEMPLATE_COMMAND is a command
    if ! command -v "$RUN_TEMPLATE_COMMAND" &> /dev/null; then
        echo "Error: 'RUN_TEMPLATE_COMMAND=\"$RUN_TEMPLATE_COMMAND\"' is not a valid command"
        return 1
    fi

    # Check if from_file_or_dir and to_file_or_dir are provided and both are same type (file or directory)
    if [[ -z "$from_file_or_dir" || -z "$to_file_or_dir" ]]; then
        echo "Error: Both 'from_file_or_dir' and 'to_file_or_dir' must be provided."
        return 1
    fi

    # Create reusable function to process single file
    function process_file() {
        local input_file="$1"
        local output_file="$2"

        echo "Processing file: $input_file -> $output_file"

        # if output_file does not exist, create it
        if [[ ! -f "$output_file" ]]; then
            mkdir -p "$(dirname "$output_file")" # Ensure the output directory exists
            touch "$output_file"
        fi

        # Both have to be files
        if [[ -f "$input_file" && -f "$output_file" ]]; then
            "$RUN_TEMPLATE_COMMAND" "$input_file" | bash > "$output_file"
        else
            echo "Error: Both input and output must be files."
            return 1
        fi
    }

    # If both are directories, process all files in the directory recursively using find
    if [[ -d "$from_file_or_dir" && -d "$to_file_or_dir" ]]; then
        echo "Processing all files in directory: $from_file_or_dir -> $to_file_or_dir"
        find "$from_file_or_dir" -type f | while read -r input_file; do
            local relative_path="${input_file#$from_file_or_dir/}"
            local output_file="$to_file_or_dir/$relative_path"
            process_file "$input_file" "$output_file"
            if [[ $? -ne 0 ]]; then
                echo "Error processing file: $input_file"
                return 1
            fi
        done
    else
        # process_file will check if both are files
        process_file "$from_file_or_dir" "$to_file_or_dir"
        return $?
    fi
    return 0
}
