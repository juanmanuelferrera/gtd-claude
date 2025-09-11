#!/bin/sh

# macOS Voice-to-Text using built-in speech recognition
echo "Starting voice recognition..."
echo "Speak now, the system will automatically detect when you stop speaking."

# Use macOS built-in speech recognition via automator or shortcuts
# This uses the Shortcuts app if available, or falls back to recording + whisper

# Method 1: Try using Shortcuts (if user has set it up)
if command -v shortcuts >/dev/null 2>&1; then
    echo "Using Shortcuts app for voice recognition..."
    shortcuts run "Voice to Text" 2>/dev/null && exit 0
fi

# Method 2: Record audio and use faster-whisper (fallback)
echo "Recording audio. Press C-c to stop..."
ffmpeg -hide_banner -nostats -loglevel quiet -y -f avfoundation -i ":0" "/tmp/audio.wav" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "Transcribing audio..."
    
    # Check if faster-whisper is available
    if command -v faster-whisper >/dev/null 2>&1; then
        faster-whisper "/tmp/audio.wav" --model base --output_format txt -o /tmp/transcription 2>/dev/null
        if [ -f "/tmp/transcription/audio.txt" ]; then
            pbcopy < /tmp/transcription/audio.txt
            echo "DONE! Transcription copied to clipboard."
        else
            echo "Error: Transcription failed."
        fi
    elif command -v whisper >/dev/null 2>&1; then
        # Fallback to regular whisper
        whisper "/tmp/audio.wav" --model base --fp16 False --output_format txt -o /tmp/transcription 2>/dev/null
        if [ -f "/tmp/transcription/audio.txt" ]; then
            pbcopy < /tmp/transcription/audio.txt
            echo "DONE! Transcription copied to clipboard."
        else
            echo "Error: Transcription failed."
        fi
    else
        echo "Error: Neither faster-whisper nor whisper found."
        echo "Install with: pip install faster-whisper"
        echo "Or use macOS Shortcuts app for voice-to-text"
        rm -f "/tmp/audio.wav"
        exit 1
    fi
    
    # Cleanup
    rm -f "/tmp/audio.wav"
    rm -rf "/tmp/transcription"
else
    echo "Error: Could not record audio. Check microphone permissions."
    exit 1
fi