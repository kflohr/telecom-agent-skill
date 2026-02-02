#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
PORT="5433"

echo "🏋️‍♂️ Forcing Database Schema Push..."
echo "This will create the missing tables."

ssh -i "$KEY" "$HOST" << EOF
    set -e
    
    cd api
    # Target our confirmed Port 5433
    export DATABASE_URL="postgresql://telecom:telecom@127.0.0.1:$PORT/telecom"
    
    echo "Using DB: \$DATABASE_URL"
    
    # Use db push instead of migrate deploy
    # This works even without migration files
    npx prisma db push --accept-data-loss
    
    # Seed (optional - create default workspace if needed, but app might do it)
    # npx prisma db seed 
    
    echo "✅ Schema Pushed."
    
    echo "🚀 Restarting App..."
    DATABASE_URL="\$DATABASE_URL" TELECOM_API_URL="http://localhost:3000" pm2 restart telecom-api --update-env
    
    echo "⏳ Waiting..."
    sleep 3
    
    echo "🔎 Final Health Check:"
    curl -s http://localhost:3000/v1/health
EOF
