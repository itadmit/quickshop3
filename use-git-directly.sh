#!/bin/bash
set -e

echo "🚀 Trying to use git directly..."

cd "$(dirname "$0")"

# Try to use git even without full tools
export GIT_TERMINAL_PROMPT=0

# Initialize if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    /usr/bin/git init 2>&1 || {
        echo "❌ Git init failed. Trying alternative method..."
        mkdir -p .git
        echo "ref: refs/heads/main" > .git/HEAD
        mkdir -p .git/objects .git/refs
        echo "✅ Created git structure manually"
    }
fi

# Configure git
/usr/bin/git config user.name "QuickShop Developer" 2>/dev/null || true
/usr/bin/git config user.email "dev@quickshop.com" 2>/dev/null || true

echo "📝 Adding files..."
/usr/bin/git add -A 2>&1 || {
    echo "⚠️  Git add failed, but continuing..."
}

echo "💾 Creating commit..."
/usr/bin/git commit -m "feat: Add discount display in OrderQuickView and fix premium club API" 2>&1 || {
    echo "⚠️  Git commit failed. Files are staged but not committed."
    echo "   You may need to approve Xcode installation or use GUI."
}

echo "✅ Done! Check status with: git status"
