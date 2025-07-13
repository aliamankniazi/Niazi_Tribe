#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment..."

# Check for required tools
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo "📥 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment completed!"
echo "🌐 Your application should now be accessible at your Firebase hosting URL"
echo "⚠️ Don't forget to:"
echo "  1. Check Firebase Console for deployment status"
echo "  2. Verify your Firebase security rules"
echo "  3. Monitor your Firebase usage and quotas"
echo "  4. Test the deployed application" 