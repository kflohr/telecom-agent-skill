#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
PORT="5433"

# The token from your .env file
TOKEN="sk_live_289347293847"

echo "🌱 Seeding Initial Workspace with Token: $TOKEN"

ssh -i "$KEY" "$HOST" << EOF
    set -e
    
    # SQL to insert workspace if it doesn't exist
    SQL="INSERT INTO \"public\".\"Workspace\" (id, \"apiToken\", name, \"updatedAt\") VALUES ('ws_init_001', '$TOKEN', 'Primary Workspace', NOW()) ON CONFLICT (\"apiToken\") DO NOTHING;"
    
    # Run against Port 5433
    PGPASSWORD=telecom psql -h 127.0.0.1 -p $PORT -U telecom -d telecom -c "\$SQL"
    
    echo "✅ Workspace Seeded."
    echo "🔎 Verifying:"
    PGPASSWORD=telecom psql -h 127.0.0.1 -p $PORT -U telecom -d telecom -c "SELECT * FROM \"public\".\"Workspace\";"
EOF
