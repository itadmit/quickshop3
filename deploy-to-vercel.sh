#!/bin/bash
set -e

echo "🚀 Deploying to Vercel..."

cd "$(dirname "$0")"

# Check if logged in
if ! vercel whoami &>/dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

echo "📦 Deploying project..."
vercel --prod

echo "✅ Deployment complete!"
