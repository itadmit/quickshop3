#!/bin/bash

# Script to push changes to Git after Xcode Command Line Tools installation
# Run this after the installation dialog completes

set -e

echo "🔍 Checking if Xcode Command Line Tools are installed..."

# Wait for installation to complete
while ! xcode-select -p &>/dev/null; do
    echo "⏳ Waiting for Xcode Command Line Tools installation to complete..."
    echo "   Please complete the installation dialog if it's still open."
    sleep 3
done

echo "✅ Xcode Command Line Tools are installed!"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check git status
echo "📊 Checking git status..."
git status --short || {
    echo "❌ Git is not working. Please try again."
    exit 1
}

# Configure git user if not set
if [ -z "$(git config user.name)" ]; then
    echo "⚙️  Configuring git user..."
    git config user.name "QuickShop Developer"
    git config user.email "dev@quickshop.com"
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
    git commit -m "feat: Update project files

- Update package-lock.json
- Project changes and improvements"
fi

# Check if remote exists
if git remote | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    echo "🌐 Remote repository: $REMOTE_URL"
    
    # Get current branch name
    BRANCH=$(git branch --show-current || echo "main")
    
    # Push to remote
    echo "⬆️  Pushing to remote..."
    git push -u origin "$BRANCH" || {
        echo "⚠️  Push failed. Trying 'main' branch..."
        git push -u origin main || {
            echo "⚠️  Push failed. Please check your remote repository configuration."
            echo "   To add a remote: git remote add origin <your-repo-url>"
            exit 1
        }
    }
    echo "✅ Successfully pushed to remote!"
else
    echo "⚠️  No remote repository configured"
    echo ""
    echo "To add a remote repository and push:"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
    echo ""
    echo "Or use GitHub Desktop to publish your repository."
fi

echo ""
echo "✅ Done!"

