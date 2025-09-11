#!/bin/sh
echo "Recording. Press C-c to stop..."
ffmpeg -hide_banner -nostats -loglevel quiet -y -f avfoundation -i ":0" "/tmp/audio.wav"
echo "Transcribing audio..."
faster-whisper "/tmp/audio.wav" --model base --output_format txt -o /tmp/transcription
pbcopy < /tmp/transcription/audio.txt
echo "DONE! Check your Clipboard"