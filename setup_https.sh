#!/bin/bash
set -e

echo "🔒 Setting up Secure HTTPS connection for telop.dev..."

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
DOMAIN="telop.dev"

ssh -i "$KEY" "$HOST" << EOF
  # 1. Install Certbot
  echo "📦 Installing Certbot..."
  sudo apt-get update
  sudo apt-get install -y certbot python3-certbot-nginx

  # 2. Obtain Certificate (Interactive Mode disabled)
  echo "🔑 Requesting Let's Encrypt Certificate..."
  
  # Check if Nginx is configured properly first
  if sudo nginx -t; then
      # Run Certbot non-interactively
      sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --redirect
  else
      echo "❌ Nginx config check failed. Cannot setup SSL."
      exit 1
  fi

  echo "✅ HTTPS Enabled!"
EOF

echo "🎉 SSL Setup Complete. You can now visit https://$DOMAIN"
