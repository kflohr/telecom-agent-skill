#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
PORT="5433"

echo "🔌 Switching Application to Correct Database Port ($PORT)..."

ssh -i "$KEY" "$HOST" << EOF
    set -e
    
    # 1. Define Correct URL
    NEW_DB_URL="postgresql://telecom:telecom@127.0.0.1:$PORT/telecom"
    
    echo "🎯 Target: 127.0.0.1:$PORT"

    # 2. Run Migration (Verification)
    echo "🔄 Running Migrations against port $PORT..."
    cd api
    export DATABASE_URL="\$NEW_DB_URL"
    npx prisma migrate deploy
    
    # 3. Update PM2 Runtime Config
    echo "🚀 Restarting API with new config..."
    DATABASE_URL="\$NEW_DB_URL" TELECOM_API_URL="http://localhost:3000" pm2 restart telecom-api --update-env
    
    echo "🔎 Final Health Check:"
    sleep 2
    curl -s http://localhost:3000/v1/health
EOF
