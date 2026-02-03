#!/bin/bash
echo "🚀 Starting Web Deployment..."
echo "🔄 Syncing apps/web/src to root..."
cp -R apps/web/src/* .
echo "🏗️  Building Web App..."
VITE_API_URL=https://telop.dev npx vite build
echo "☁️  Uploading to EC2..."
scp -i /Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem -r dist/* ubuntu@16.171.31.185:/home/ubuntu/dashboard/
echo "✅ Done! https://telop.dev"
