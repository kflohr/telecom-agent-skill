#!/bin/bash
set -e

KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"
TOKEN="sk_live_289347293847"

echo "🤖 Installing Skill on Clawdbot..."

# 1. Package Locally
if [ -f "package_skill.sh" ]; then
    chmod +x package_skill.sh
    ./package_skill.sh
else
    echo "❌ missing package_skill.sh"
    exit 1
fi

ZIP_FILE="telecom-skill-v1.1.0.zip"

# 2. Upload to Server
echo "☁️  Uploading $ZIP_FILE..."
scp -i "$KEY" "$ZIP_FILE" "$HOST:~/$ZIP_FILE"

# 3. Install on Server
ssh -i "$KEY" "$HOST" << EOF
    set -e
    
    echo "📂 Setting up Skill Directory..."
    mkdir -p ~/clawd/skills/telecom
    
    echo "📦 Unzipping..."
    unzip -o ~/$ZIP_FILE -d ~/clawd/skills/telecom
    
    echo "🔧 executable permissions..."
    chmod +x ~/clawd/skills/telecom/telecom
    
    echo "🔑 Configuring Environment..."
    ENV_FILE=~/clawd/.env
    
    # Append Token if not exists
    if ! grep -q "TELECOM_API_TOKEN" "\$ENV_FILE"; then
        echo "" >> "\$ENV_FILE"
        echo "TELECOM_API_TOKEN=$TOKEN" >> "\$ENV_FILE"
        echo "Added Token to .env"
    else
        echo "Token already exists in .env"
    fi
    
    # Append URL if not exists
    if ! grep -q "TELECOM_API_URL" "\$ENV_FILE"; then
        echo "TELECOM_API_URL=https://telop.dev" >> "\$ENV_FILE"
         echo "Added URL to .env"
    fi
    
    echo "✅ Skill Installed Successfully!"
EOF
