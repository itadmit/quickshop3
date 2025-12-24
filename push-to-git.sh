#!/bin/bash

# Script to initialize git repo and push to remote
# Run this after Xcode Command Line Tools are installed

set -e

echo "🚀 Starting git push process..."

# Navigate to project directory
cd "$(dirname "$0")"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Xcode Command Line Tools first."
    echo "   Run: xcode-select --install"
    exit 1
fi

# Initialize git repo if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Configure git user if not set
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️  Configuring git user..."
    git config --global user.name "QuickShop Developer"
    git config --global user.email "dev@quickshop.com"
fi

# Add all files
echo "📝 Adding all files..."
git add -A

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    # Create commit
    echo "💾 Creating commit..."
    git commit -m "feat: Add discount display in OrderQuickView and fix premium club API

- Add discount display for each line item in OrderQuickView (original price struck through, discounted price)
- Add discount code display in OrderQuickView summary
- Fix discount_codes parsing in orders API
- Fix premium-club/progress API import path
- Use verifyStorefrontCustomerOptional for premium club progress endpoint"
fi

# Check if remote exists
if git remote | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    echo "🌐 Remote repository: $REMOTE_URL"
    
    # Push to remote
    echo "⬆️  Pushing to remote..."
    git push -u origin main || git push -u origin master || echo "⚠️  Please set up remote repository first"
else
    echo "⚠️  No remote repository configured"
    echo "   To add a remote repository, run:"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
fi

echo "✅ Done!"

