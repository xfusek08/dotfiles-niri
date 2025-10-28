#!/usr/bin/env zsh

function run_bash_tpl() {
    local input_path="$1"

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

    # Check if input_path is provided
    if [[ -z "$input_path" ]]; then
        echo "Error: File or directory path must be provided."
        return 1
    fi

    if [[ ! -e "$input_path" ]]; then
        echo "Error: '$input_path' does not exist."
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

    # Function to generate output filename from template filename
    function get_output_filename() {
        local input_file="$1"
        local output_file="${input_file%.template*}"
        
        # If file was *.template.ext, add back the extension
        if [[ "$input_file" == *.template.* ]]; then
            local ext="${input_file##*.}"
            output_file="${output_file}.${ext}"
        fi
        
        echo "$output_file"
    }

    # Handle single file
    if [[ -f "$input_path" ]]; then
        # Check if file matches template pattern
        if [[ "$input_path" == *.template || "$input_path" == *.template.* ]]; then
            local output_file=$(get_output_filename "$input_path")
            process_file "$input_path" "$output_file"
            return $?
        else
            echo "Error: File '$input_path' does not match template pattern (*.template or *.template.*)"
            return 1
        fi
    fi

    # Handle directory
    if [[ -d "$input_path" ]]; then
        echo "Processing all template files in directory: $input_path"
        find "$input_path" -type f \( -name "*.template.*" -o -name "*.template" \) | while read -r input_file; do
            local output_file=$(get_output_filename "$input_file")
            
            process_file "$input_file" "$output_file"
            if [[ $? -ne 0 ]]; then
                echo "Error processing file: $input_file"
                return 1
            fi
        done
    fi
    
    return 0
}
