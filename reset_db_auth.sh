#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"

echo "💣 Nuke & Pave: Resetting Database Auth Config..."

ssh -i "$KEY" "$HOST" << 'EOF'
    set -e
    
    # 1. Find Config
    PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -n 1)
    if [ -z "$PG_HBA" ]; then
        echo "❌ Could not find pg_hba.conf!"
        exit 1
    fi
    echo "📄 Changing config at: $PG_HBA"

    # 2. Backup
    sudo cp "$PG_HBA" "$PG_HBA.bak"
    
    # 3. OVERWRITE with Minimal Config (Use /tmp trick for permissions)
    # This removes ALL default rules and replaces them with pure TRUST.
    TEMP_FILE="/tmp/pg_hba_minimal.conf"
    
    echo "# MINIMAL TRUST CONFIG" > "$TEMP_FILE"
    echo "local   all             all                                     trust" >> "$TEMP_FILE"
    echo "host    all             all             127.0.0.1/32            trust" >> "$TEMP_FILE"
    echo "host    all             all             ::1/128                 trust" >> "$TEMP_FILE"
    
    sudo mv "$TEMP_FILE" "$PG_HBA"
    sudo chown postgres:postgres "$PG_HBA"
    sudo chmod 640 "$PG_HBA"
    
    echo "📄 New Config Content:"
    sudo cat "$PG_HBA"
    
    echo "🔄 Restarting Postgres..."
    sudo systemctl restart postgresql
    sleep 3

    # 4. Verify & Heal
    echo "🧪 Testing Connection..."
    
    # Re-apply password just to be sane (though trust ignores it)
    sudo -u postgres psql -c "ALTER USER telecom WITH PASSWORD 'telecom';"
    
    # Check connection
    if PGPASSWORD=telecom psql -h 127.0.0.1 -U telecom -d telecom -c "SELECT 1 as connected;" > /dev/null 2>&1; then
        echo "✅ Connection Fixed!"
        
        # 5. Fix App
        echo "🚀 Redeploying App..."
        cd api
        npm install
        export DATABASE_URL="postgresql://telecom:telecom@127.0.0.1:5432/telecom"
        npx prisma migrate deploy
        
        # Switch PM2 to use these confirmed working settings
        DATABASE_URL="postgresql://telecom:telecom@127.0.0.1:5432/telecom" TELECOM_API_URL="http://localhost:3000" pm2 restart telecom-api --update-env
        
        echo "🔎 Final Health Check:"
        curl -s http://localhost:3000/v1/health
    else
        echo "❌ STILL FAILING. Checking logs..."
        sudo tail -n 20 /var/log/postgresql/postgresql-16-main.log
    fi
EOF
