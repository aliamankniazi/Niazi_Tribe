#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm if not installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install MySQL if not installed
if ! command -v mysql &> /dev/null; then
    echo "📥 Installing MySQL..."
    sudo apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

# Install Redis if not installed
if ! command -v redis-cli &> /dev/null; then
    echo "📥 Installing Redis..."
    sudo apt-get install -y redis-server
    sudo systemctl start redis
    sudo systemctl enable redis
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -y pm2 -g
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📥 Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p /var/www/niazitribe
sudo chown -R $USER:$USER /var/www/niazitribe

# Copy application files
echo "📋 Copying application files..."
cp -r ./* /var/www/niazitribe/

# Install dependencies
echo "📦 Installing dependencies..."
cd /var/www/niazitribe
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Setup environment
echo "⚙️ Setting up environment..."
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    exit 1
fi
cp .env.production .env

# Setup database
echo "🗄️ Setting up database..."
mysql -u root -p < setup-database.sql

# Setup Nginx configuration
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/niazitribe << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/niazitribe /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Start the application with PM2
echo "🚀 Starting the application..."
pm2 start npm --name "niazitribe-api" -- run start:api
pm2 start npm --name "niazitribe-ui" -- run start:ui
pm2 save

echo "✅ Deployment completed!"
echo "🌐 Your application should now be accessible at: http://yourdomain.com"
echo "⚠️ Don't forget to:"
echo "  1. Setup SSL with Certbot"
echo "  2. Configure your domain DNS settings"
echo "  3. Set up regular backups"
echo "  4. Monitor your application" 