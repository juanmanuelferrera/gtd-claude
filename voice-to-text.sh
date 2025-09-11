#!/bin/sh
echo "Recording. Press C-c to stop..."
ffmpeg -hide_banner -nostats -loglevel quiet -y -f alsa -i default "/tmp/audio.wav"
echo "Transcribing audio..."
faster-whisper "/tmp/audio.wav" --model base --output_format txt -o /tmp/transcription
xclip -selection c < /tmp/transcription/audio.txt
echo "DONE! Check your Clipboard"