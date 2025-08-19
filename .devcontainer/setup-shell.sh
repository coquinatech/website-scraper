#!/bin/bash
set -e

# Configure zsh history
cat >> ~/.zshrc << 'EOF'

# History configuration
export HISTFILE=~/.zsh_history
export HISTSIZE=10000
export SAVEHIST=10000

# History options
setopt HIST_IGNORE_DUPS      # Don't record duplicate commands
setopt SHARE_HISTORY         # Share history between sessions
setopt HIST_REDUCE_BLANKS    # Remove extra blanks from commands
setopt HIST_VERIFY           # Show command before executing from history
setopt APPEND_HISTORY        # Append to history file, don't overwrite
setopt INC_APPEND_HISTORY    # Add commands immediately to history
EOF

echo "Shell history configured successfully"


