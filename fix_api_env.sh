#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
PORT="5433"

echo "🧹 Performing Clean Restart of API..."

ssh -i "$KEY" "$HOST" << EOF
    set -e
    
    # 1. Stop & Delete Process (Clear Env Cache)
    echo "🛑 Killing old process..."
    pm2 delete telecom-api || true
    
    # 2. Check for conflicting .env file
    if [ -f "api/.env" ]; then
        echo "🗑️  Removing conflicting local .env file..."
        rm api/.env
    fi
    
    # 3. Start FRESH with explicit variables
    # We use the port 5433 URL since that's where Postgres is listening
    DB_URL="postgresql://telecom:telecom@127.0.0.1:$PORT/telecom"
    API_URL="http://localhost:3000"
    
    echo "🚀 Starting new process with TARGET PORT: $PORT"
    echo "DB URL: \$DB_URL"
    
    cd api
    DATABASE_URL="\$DB_URL" TELECOM_API_URL="\$API_URL" pm2 start dist/server.js --name telecom-api
    pm2 save
    
    # 4. Final verification
    echo "⏳ Waiting for startup..."
    sleep 3
    echo "🔎 Health Check:"
    curl -s http://localhost:3000/v1/health
EOF
