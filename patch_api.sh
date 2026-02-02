#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"

echo "🩹 Patching API Logic..."

# 1. Build Locally
echo "🏗️  Building API..."
cd apps/api
# Ensure we have dependencies for build
npm install
# Build
npx tsc
cd ../..

# 2. Upload Dist
echo "☁️  Uploading Patch..."
rsync -avz -e "ssh -i $KEY" apps/api/dist/ $HOST:/home/ubuntu/api/dist/

# 3. Restart
echo "🔄 Reloading Server..."
ssh -i "$KEY" "$HOST" "pm2 reload telecom-api"

echo "✅ Patch Applied!"
