#!/bin/bash

# Navigate to the repository root
cd ../..

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@latest
fi

# Install dependencies
pnpm install --frozen-lockfile

# Build the app
pnpm build --filter=app
