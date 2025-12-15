#!/bin/bash

# Usage: ./extract-files.sh STEP2-ALL-FILES-COMBINED.txt

INPUT_FILE="$1"
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File $INPUT_FILE not found"
    exit 1
fi

cd ./defendx-siem || exit 1

current_file=""
writing=0

while IFS= read -r line; do
    if [[ $line =~ ^FILE:\ (.+)$ ]]; then
        current_file="${BASH_REMATCH[1]}"
        writing=0
        continue
    fi
    
    if [[ $line == "===========================================  ]]; then
        if [ -n "$current_file" ] && [ $writing -eq 0 ]; then
            writing=1
            # Create directory
            mkdir -p "$(dirname "$current_file")"
            # Clear file
            > "$current_file"
            echo "Creating: $current_file"
        elif [ $writing -eq 1 ]; then
            writing=0
            current_file=""
        fi
        continue
    fi
    
    if [ $writing -eq 1 ] && [ -n "$current_file" ]; then
        echo "$line" >> "$current_file"
    fi
done < "$INPUT_FILE"

echo "✓ All files extracted!"
