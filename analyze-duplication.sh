#!/bin/bash

echo "🔍 Analyzing JavaScript Duplication..."
echo ""

# Extract unique function names from each file
echo "📊 Function counts:"
echo "extracted_js.js: $(grep -o 'function [a-zA-Z_][a-zA-Z0-9_]*' extracted_js.js | wc -l | tr -d ' ') functions"
echo "js/tasks.js: $(grep -o 'function [a-zA-Z_][a-zA-Z0-9_]*' js/tasks.js | wc -l | tr -d ' ') functions"
echo "js/ui.js: $(grep -o 'function [a-zA-Z_][a-zA-Z0-9_]*' js/ui.js | wc -l | tr -d ' ') functions"
echo "js/sync.js: $(grep -o 'function [a-zA-Z_][a-zA-Z0-9_]*' js/sync.js | wc -l | tr -d ' ') functions"
echo ""

# Find duplicate functions
echo "🔄 Checking for duplicate functions..."
grep -oh 'function [a-zA-Z_][a-zA-Z0-9_]*' extracted_js.js | sed 's/function //' | sort -u > /tmp/extracted_funcs.txt
grep -oh 'function [a-zA-Z_][a-zA-Z0-9_]*' js/tasks.js | sed 's/function //' | sort -u > /tmp/tasks_funcs.txt

DUPLICATES=$(comm -12 /tmp/extracted_funcs.txt /tmp/tasks_funcs.txt | wc -l | tr -d ' ')
echo "Duplicates between extracted_js.js and tasks.js: $DUPLICATES functions"

if [ $DUPLICATES -gt 0 ]; then
    echo "Sample duplicates:"
    comm -12 /tmp/extracted_funcs.txt /tmp/tasks_funcs.txt | head -10
fi

