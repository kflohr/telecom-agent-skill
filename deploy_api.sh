#!/bin/bash
set -e

echo "🚀 Starting API Deployment..."

# 1. Install & Build
echo "📦 Installing Dependencies..."
cd apps/api
npm install
echo "🏗️  Building API..."
npm run build
cd ../..

echo "🛠️  Building CLI..."
cd apps/cli
npm install
npm run build
# Link binary globally so 'telecom' command works
echo "🔗 Linking CLI globally..."
if ! npm link --force; then
    echo "⚠️  Standard link failed (permission denied)."
    echo "🔑 Converting to superuser to complete installation..."
    echo "   (Please enter your password if prompted)"
    sudo npm link --force
fi
cd ../..

# 2. Upload to EC2
echo "☁️  Uploading to EC2..."
KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
API_DIR="/home/ubuntu/api"

# Create directory
ssh -i "$KEY" "$HOST" "mkdir -p $API_DIR"

# Upload generated files and config
# Note: Excluding node_modules to save bandwidth, will install on server
# Also uploading .env to ensure DATABASE_URL is available for Prisma
if [ -f "apps/api/.env" ]; then
    scp -i "$KEY" apps/api/.env "$HOST:$API_DIR/.env"
elif [ -f ".env" ]; then
    echo "⚠️  Using root .env for API..."
    scp -i "$KEY" .env "$HOST:$API_DIR/.env"
else
    echo "❌ No .env file found! Database migration will likely fail."
fi

scp -i "$KEY" -r apps/api/dist apps/api/package.json apps/api/prisma "$HOST:$API_DIR/"

# 3. Start on Server
echo "🚀 Starting Service..."
ssh -i "$KEY" "$HOST" << 'EOF'
  cd api
  # Ensure we have env vars for prisma
  if [ -f .env ]; then
      echo "🔧 Loading environment variables..."
      set -a
      source .env
      set +a
  fi

  npm install --production
  npx prisma generate
  npx prisma db push --accept-data-loss

  
  if ! command -v pm2 &> /dev/null; then
      sudo npm install -g pm2
  fi

  # Start/Reload PM2
  # Check if process exists
  pm2 describe telecom-api > /dev/null 2>&1
  if [ $? -eq 0 ]; then
      pm2 reload telecom-api
  else
      TELECOM_API_URL="http://localhost:3000" pm2 start dist/server.js --name telecom-api
  fi

  pm2 save
  
  # Wait a moment for startup
  sleep 2
  echo "📜 Startup Logs:"
  pm2 logs telecom-api --lines 50 --nostream
EOF

# 4. Update Nginx
echo "Mw Updating Nginx Config..."
NGINX_CONF="telecom.nginx"
# Assuming the updated nginx file is in the current directory or nearby
# In this script execution context, we need to locate it.
# We will upload the local artifact.
scp -i "$KEY" "$NGINX_CONF" "$HOST:/tmp/$NGINX_CONF"
ssh -i "$KEY" "$HOST" "sudo mv /tmp/$NGINX_CONF /etc/nginx/sites-available/telecom && \
    sudo ln -sf /etc/nginx/sites-available/telecom /etc/nginx/sites-enabled/telecom && \
    sudo rm -f /etc/nginx/sites-enabled/default && \
    sudo nginx -t && \
    sudo systemctl reload nginx"

echo "✅ API Deployed & Live at http://13.61.21.177/v1"
