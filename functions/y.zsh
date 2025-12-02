function y() {
	# Create a temporary file to store yazi's final directory
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
	
	# Launch yazi with all passed arguments and tell it to write the current directory to the temp file on exit
	yazi "$@" --cwd-file="$tmp"
	
	# Read the directory from temp file, check if it's not empty and different from current directory
	if cwd="$(cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
		# Change to the directory that yazi was in when it exited
		builtin cd -- "$cwd"
	fi
	
	# Clean up the temporary file
	rm -f -- "$tmp"
}
