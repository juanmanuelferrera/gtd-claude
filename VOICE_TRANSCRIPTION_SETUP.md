# Voice-to-Text Transcription Setup

## Overview
This setup allows you to record audio and transcribe it using faster-whisper, accessible from both terminal and Emacs.

## Files Created
- `voice-to-text.sh` - Main transcription script using faster-whisper

## Prerequisites
Install required dependencies:
```bash
# Install faster-whisper
pip install faster-whisper

# Install ffmpeg (for audio recording)
sudo apt install ffmpeg  # Ubuntu/Debian
# or
brew install ffmpeg      # macOS

# Install xclip (for clipboard access)
sudo apt install xclip   # Ubuntu/Debian
# or
brew install xclip       # macOS (or use pbcopy on macOS)
```

## Terminal Setup

### 1. Copy script to PATH
```bash
sudo cp voice-to-text.sh /usr/local/bin/vtt
sudo chmod +x /usr/local/bin/vtt
```

### 2. Add alias (optional)
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias vtt='/path/to/voice-to-text.sh'
```

### 3. Usage in Terminal
```bash
vtt  # Start recording, press Ctrl+C to stop and transcribe
```

## Emacs Integration

Add this to your Emacs config (`~/.emacs` or `~/.emacs.d/init.el`):

```elisp
;; Voice-to-text functions
(defun voice-to-text ()
  "Record audio and transcribe to clipboard using faster-whisper"
  (interactive)
  (let ((script-path "/Users/juanmanuelferreradiaz/.emacs.d/git_projects/gtd-claude/voice-to-text.sh"))
    (message "Starting voice recording...")
    (async-shell-command script-path "*Voice Transcription*")
    (with-current-buffer "*Voice Transcription*"
      (goto-char (point-max)))))

(defun voice-to-text-insert ()
  "Record audio, transcribe, and insert at cursor position"
  (interactive)
  (let ((script-path "/Users/juanmanuelferreradiaz/.emacs.d/git_projects/gtd-claude/voice-to-text.sh"))
    (message "Recording... Press C-g in shell buffer to stop")
    (start-process "voice-transcribe" "*Voice*" "sh" script-path)
    (set-process-sentinel 
     (get-process "voice-transcribe")
     (lambda (proc event)
       (when (string-match "finished" event)
         (let ((transcription (shell-command-to-string "xclip -selection c -o")))
           (insert (string-trim transcription))
           (message "Voice transcription inserted!")))))))

;; Keybindings
(global-set-key (kbd "C-c v r") 'voice-to-text)        ; Record to clipboard
(global-set-key (kbd "C-c v i") 'voice-to-text-insert) ; Record and insert
(global-set-key (kbd "<f12>") 'voice-to-text)          ; Quick access
```

## Emacs Usage

After adding to your config and restarting Emacs:

- **C-c v r** - Record audio and copy transcription to clipboard
- **C-c v i** - Record audio and insert transcription at cursor
- **F12** - Quick record to clipboard

## macOS Adjustments

If you're on macOS, you might need to adjust the script:

```bash
#!/bin/sh
echo "Recording. Press C-c to stop..."
ffmpeg -hide_banner -nostats -loglevel quiet -y -f avfoundation -i ":0" "/tmp/audio.wav"
echo "Transcribing audio..."
faster-whisper "/tmp/audio.wav" --model base --output_format txt -o /tmp/transcription
pbcopy < /tmp/transcription/audio.txt  # Use pbcopy instead of xclip
echo "DONE! Check your Clipboard"
```

## Troubleshooting

### Audio Input Issues
- Linux: Check `arecord -l` for available audio devices
- macOS: Check `ffmpeg -f avfoundation -list_devices true -i ""`

### Permission Issues
- Ensure microphone permissions are granted
- Check audio device access in system settings

### faster-whisper Not Found
```bash
# Install in virtual environment
python -m venv whisper-env
source whisper-env/bin/activate
pip install faster-whisper
```

## Workflow
1. Run the script (terminal: `vtt`, Emacs: keybindings)
2. Speak into your microphone
3. Press Ctrl+C to stop recording
4. Script automatically transcribes and copies to clipboard
5. Paste anywhere with Ctrl+V

## Performance Notes
- **faster-whisper** is 2-4x faster than regular whisper
- Uses `base` model by default (good speed/accuracy balance)
- For better accuracy: change `--model base` to `--model small` or `--model medium`
- For faster processing: use `--model tiny`