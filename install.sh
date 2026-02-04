#!/bin/bash
# Wrapper to launch the full infrastructure deployment
cd infrastructure
chmod +x deploy_api.sh
./deploy_api.sh
