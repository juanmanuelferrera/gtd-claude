#!/bin/bash

# Simple translation script for Claude Code
# Usage: ./translate.sh filename [language]
# Example: ./translate.sh nama.org Spanish

FILE="${1:-nama.org}"
LANG="${2:-Spanish}"

# Use "Spanish from Spain" (Castilian)
if [ "$LANG" = "Spanish" ]; then
    LANG_DESC="Spanish from Spain (Castilian, using vosotros form)"
else
    LANG_DESC="$LANG"
fi

echo "Translating $FILE to $LANG_DESC..."

claude -p "Translate $FILE to $LANG_DESC. Read the file, translate all text naturally, then use Edit tool to replace the entire content with the translation. Don't translate: code blocks, URLs, technical terms."

echo "Done! Check $FILE for the translation."
