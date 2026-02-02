#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
PORT="5433"

echo "🌍 Fixing Public Webhook URL for Twilio..."

ssh -i "$KEY" "$HOST" << EOF
    set -e
    
    # We must start the process with the PUBLIC domain
    # otherwise Twilio tries to call 'localhost' and fails.
    
    DB_URL="postgresql://telecom:telecom@127.0.0.1:$PORT/telecom"
    PUBLIC_URL="https://telop.dev"
    
    echo "Setting Webhook Base: \$PUBLIC_URL"
    
    cd api
    pm2 delete telecom-api || true
    
    DATABASE_URL="\$DB_URL" TELECOM_API_URL="\$PUBLIC_URL" pm2 start dist/server.js --name telecom-api
    pm2 save
    
    echo "✅ Fixed."
EOF
