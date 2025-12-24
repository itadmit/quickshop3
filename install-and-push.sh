#!/bin/bash
set -e

echo "🔧 Installing Xcode Command Line Tools..."

# Try to install
xcode-select --install 2>&1 || true

echo "⏳ Waiting for installation to complete..."
echo "Please approve the installation dialog if it appears."

# Wait for installation
while ! xcode-select -p &>/dev/null; do
    sleep 2
done

echo "✅ Installation complete!"
echo "📦 Initializing git..."

cd "$(dirname "$0")"
git init
git config user.name "QuickShop Developer" || true
git config user.email "dev@quickshop.com" || true

echo "📝 Adding files..."
git add -A

echo "💾 Creating commit..."
git commit -m "feat: Add discount display in OrderQuickView and fix premium club API

- Add discount display for each line item in OrderQuickView
- Add discount code display in OrderQuickView summary  
- Fix discount_codes parsing in orders API
- Fix premium-club/progress API import path"

echo "✅ Done! Ready to push."
echo "To push, run: git remote add origin <url> && git push -u origin main"
