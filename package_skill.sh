#!/bin/bash
set -e

echo "📦 Packaging Telecom Operator Skill..."

# Ensure the CLI wrapper is executable
chmod +x skills/openclaw-telecom/telecom

# Create the zip file explicitly including the manifest and skill files
# We use -j to junk paths (flatten directory structure inside zip) so 'telecom' is at root
zip -j telecom-skill-v1.1.0.zip skills/openclaw-telecom/*

echo "✅ Created: telecom-skill-v1.1.0.zip"
echo "👉 Upload this file to your OpenClaws/Moltbot instance."
echo "👉 Set Environment Variable: TELECOM_API_TOKEN=sk_live_289347293847"
