#!/bin/bash
set -e

# Update system packages
sudo apt-get update

# Install Node.js 18+ (required by the project)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm globally using sudo
sudo npm install -g pnpm@10.11.0

# Verify pnpm installation
pnpm --version

# Navigate to workspace directory
cd /mnt/persist/workspace

# Install dependencies using pnpm
pnpm install

# Add node_modules/.bin to PATH so turbo command is available
export PATH="$PWD/node_modules/.bin:$PATH"

# Also add to profile for persistence
echo 'export PATH="$PWD/node_modules/.bin:$PATH"' >> $HOME/.profile

# Verify turbo is available
which turbo || echo "Turbo not found in PATH"

# Try to run tests directly without build dependencies
pnpm test || echo "pnpm test failed, trying turbo test directly"