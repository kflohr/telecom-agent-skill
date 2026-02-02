#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"

echo "🔧 Fixing Database Authentication (Check & Fix)..."

ssh -i "$KEY" "$HOST" << 'EOF'
    set -e
    
    # 1. Find Config
    PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -n 1)
    echo "📄 Found config at: $PG_HBA"
    
    if [ -z "$PG_HBA" ]; then
        echo "❌ Could not find pg_hba.conf!"
        exit 1
    fi

    # 2. Overwrite with explicit TRUST for 127.0.0.1
    # We are being aggressive: Clean slate for local connections.
    TEMP_FILE="/tmp/pg_hba_trust.conf"
    
    echo "# TRUST RULE ADDED BY FIX_DB.SH" > "$TEMP_FILE"
    echo "host    all             all             127.0.0.1/32            trust" >> "$TEMP_FILE"
    echo "host    all             all             ::1/128                 trust" >> "$TEMP_FILE"
    echo "local   all             all                                     trust" >> "$TEMP_FILE"
    
    # Append original file for other rules (skip local/host 127/::1 if possible? No, just put ours first)
    sudo cat "$PG_HBA" >> "$TEMP_FILE"
    
    # Apply
    sudo mv "$TEMP_FILE" "$PG_HBA"
    sudo chown postgres:postgres "$PG_HBA"
    sudo chmod 640 "$PG_HBA"
    
    echo "🔍 VERIFYING CONFIG HEAD:"
    sudo head -n 5 "$PG_HBA"
    
    echo "🔄 Restarting Postgres..."
    sudo systemctl restart postgresql
    sleep 3
    
    # 3. Test Connection LOCALLY with psql
    echo "🧪 Testing connection via psql..."
    if PGPASSWORD=telecom psql -h 127.0.0.1 -U telecom -d telecom -c "SELECT 1 as connected;" > /dev/null 2>&1; then
        echo "✅ PSQL Connection Successful!"
    else
        echo "❌ PSQL Connection FAILED."
        # Attempt to debug why
        PGPASSWORD=telecom psql -h 127.0.0.1 -U telecom -d telecom -c "SELECT 1;" || true
    fi

    # 4. Run Migration with 127.0.0.1 (Forcing IPv4)
    echo "🚀 Running Application Migration..."
    cd api
    export DATABASE_URL="postgresql://telecom:telecom@127.0.0.1:5432/telecom"
    npx prisma migrate deploy
    
    # 5. Restart App with new URL
    echo "🔄 Reloading PM2..."
    DATABASE_URL="postgresql://telecom:telecom@127.0.0.1:5432/telecom" TELECOM_API_URL="http://localhost:3000" pm2 restart telecom-api --update-env
    
    echo "🔎 Final Health Check:"
    curl -s http://localhost:3000/v1/health
EOF
