#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 GitHub Secrets Setup Helper${NC}"
echo "This script will help you generate and collect necessary secrets for GitHub Actions deployment."
echo

# Generate SSH key
echo -e "${YELLOW}Generating SSH key for deployment...${NC}"
ssh-keygen -t rsa -b 4096 -C "deploy@niazitribe.com" -f ./deploy_key -N ""

echo -e "${GREEN}✅ SSH key generated!${NC}"
echo
echo -e "${YELLOW}Here are your secrets to add to GitHub:${NC}"
echo
echo "1. SSH_PRIVATE_KEY:"
echo "   Copy this private key to GitHub secrets:"
echo "   ----------------------------------------"
cat deploy_key
echo "   ----------------------------------------"
echo

echo "2. SSH_PUBLIC_KEY:"
echo "   Add this public key to your server's ~/.ssh/authorized_keys:"
echo "   ----------------------------------------"
cat deploy_key.pub
echo "   ----------------------------------------"
echo

echo -e "${YELLOW}Add these additional secrets to GitHub:${NC}"
echo
echo "3. SERVER_IP:"
echo "   Your server's IP address"
echo
echo "4. SERVER_USER:"
echo "   The username for SSH access (e.g., deploy)"
echo
echo "5. DEPLOY_PATH:"
echo "   The path where your application is deployed (e.g., /var/www/niazitribe)"
echo

echo -e "${GREEN}Instructions:${NC}"
echo "1. Go to your GitHub repository"
echo "2. Click on Settings"
echo "3. Click on Secrets and variables > Actions"
echo "4. Add each secret using the 'New repository secret' button"
echo
echo -e "${YELLOW}On your server:${NC}"
echo "1. Add the public key to ~/.ssh/authorized_keys:"
echo "   echo '$(cat deploy_key.pub)' >> ~/.ssh/authorized_keys"
echo
echo "2. Set proper permissions:"
echo "   chmod 700 ~/.ssh"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo

# Cleanup
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm deploy_key deploy_key.pub

echo -e "${GREEN}✅ Setup complete!${NC}"
echo "Make sure to add all secrets to GitHub before running the deployment workflow." 