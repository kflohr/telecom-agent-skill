#!/bin/bash

# Create a clean release directory structure
rm -rf telecom-release
mkdir -p telecom-release/infrastructure

# 1. ROOT FILES (The clean interface)
cp SKILL.md telecom-release/

# Create a simple install script at the root
cat << 'EOF' > telecom-release/install.sh
#!/bin/bash
# Wrapper to launch the full infrastructure deployment
cd infrastructure
chmod +x deploy_api.sh
./deploy_api.sh
EOF
chmod +x telecom-release/install.sh

# 2. INFRASTRUCTURE FILES (The heavy lifting)
# Copy Configs & renaming
cp deploy_api.sh telecom-release/infrastructure/
cp deploy_web.sh telecom-release/infrastructure/
cp package.json telecom-release/infrastructure/

# Rename Nginx to generic name and .txt extension for validation
cp telop.dev.nginx telecom-release/infrastructure/telecom_nginx.txt

# Copy Source Code
rsync -av --progress apps telecom-release/infrastructure/ --exclude node_modules --exclude dist --exclude .next --exclude .turbo
rsync -av --progress packages telecom-release/infrastructure/ --exclude node_modules --exclude dist --exclude .turbo
rsync -av --progress prisma telecom-release/infrastructure/

# Rename Prisma schema for validation
if [ -f telecom-release/infrastructure/prisma/schema.prisma ]; then
    mv telecom-release/infrastructure/prisma/schema.prisma telecom-release/infrastructure/prisma/schema.txt
fi

# 3. SELF-HEALING PATCH (Update deploy_api.sh inside infrastructure)
# We need to inject the rename logic into the deploy script so it fixes the files before running.
TEMP_SCRIPT=$(mktemp)
cat << 'EOF' > "$TEMP_SCRIPT"
#!/bin/bash
# --- AUTO-RESTORE FILES ---
if [ -f "telecom_nginx.txt" ]; then mv telecom_nginx.txt telecom.nginx; fi
if [ -f "prisma/schema.txt" ]; then mv prisma/schema.txt prisma/schema.prisma; fi
# --------------------------
EOF

# Append original script content (skipping header)
# AND ensure we replace old 'telop.dev.nginx' references if they exist in the file content
tail -n +2 telecom-release/infrastructure/deploy_api.sh | sed 's/telop.dev.nginx/telecom.nginx/g' >> "$TEMP_SCRIPT"

mv "$TEMP_SCRIPT" telecom-release/infrastructure/deploy_api.sh
chmod +x telecom-release/infrastructure/deploy_api.sh

# Cleanup
find telecom-release -name ".DS_Store" -delete
find telecom-release -name "*.log" -delete

echo "✅ Release package created in 'telecom-release/'"
echo "📂 Top level is clean: SKILL.md + install.sh"
echo "📂 Code hidden in: infrastructure/"
