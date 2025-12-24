#!/bin/bash
cd "$(dirname "$0")"

# Add npm global bin to PATH
export PATH="$HOME/.npm-global/bin:/usr/local/bin:$PATH"

# Try to use vercel
if command -v vercel &> /dev/null; then
    echo "🚀 Deploying with Vercel CLI..."
    vercel --prod
elif command -v npx &> /dev/null; then
    echo "🚀 Deploying with npx vercel..."
    npx vercel --prod
else
    echo "❌ Vercel CLI not found"
    echo "📋 Please use Vercel Dashboard instead:"
    echo "   1. Go to: https://vercel.com/new"
    echo "   2. Drag and drop this folder"
    echo "   3. Or connect to GitHub repository"
fi
