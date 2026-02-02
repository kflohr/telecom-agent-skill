#!/bin/bash
KEY="/Users/khristianflohr/Downloads/my_clawdbot_vm_Key.pem"
HOST="ubuntu@13.61.21.177"

ssh -i "$KEY" "$HOST" "pm2 logs telecom-api --lines 50 --nostream"
