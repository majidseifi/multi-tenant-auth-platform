#!/bin/bash

# Deploy Frontend to EC2
# This script builds the frontend locally and deploys it to EC2

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting frontend deployment...${NC}"

# Configuration
EC2_HOST="13.222.111.119"
EC2_USER="ec2-user"
SSH_KEY="$HOME/.ssh/multi-tenant-auth-key.pem"
FRONTEND_DIR="$(cd "$(dirname "$0")/../frontend" && pwd)"
DEPLOY_DIR="/var/www/frontend"

# Step 1: Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd "$FRONTEND_DIR"
VITE_API_URL=https://multi-auth.seifi.dev/api npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Copy to EC2
echo -e "${YELLOW}Copying files to EC2...${NC}"
scp -i "$SSH_KEY" -r dist ec2-user@$EC2_HOST:~/frontend-dist-new

echo -e "${GREEN}✓ Files copied${NC}"

# Step 3: Deploy on EC2
echo -e "${YELLOW}Deploying on EC2...${NC}"
ssh -i "$SSH_KEY" $EC2_USER@$EC2_HOST << 'ENDSSH'
    # Backup old version
    if [ -d /var/www/frontend ]; then
        sudo cp -r /var/www/frontend /var/www/frontend.backup.$(date +%Y%m%d_%H%M%S)
    fi

    # Deploy new version
    sudo mkdir -p /var/www/frontend
    sudo rm -rf /var/www/frontend/*
    sudo cp -r ~/frontend-dist-new/* /var/www/frontend/
    sudo chown -R nginx:nginx /var/www/frontend

    # Cleanup
    rm -rf ~/frontend-dist-new

    # Reload Nginx
    sudo nginx -t && sudo systemctl reload nginx

    echo "Frontend deployed successfully!"
ENDSSH

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Frontend URL: https://multi-auth.seifi.dev"
echo "Health Check: https://multi-auth.seifi.dev/health"
