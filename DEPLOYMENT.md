# Niazi-Tribe Deployment Guide

This guide will help you deploy the Niazi-Tribe application both locally for testing and in production.

## Prerequisites

### Local Development Environment
- Node.js (v18 or later)
- PHP 8.1 or later
- MySQL 8.0 or later
- Redis
- Composer
- Git

### Production Environment
- Linux server (Ubuntu 22.04 LTS recommended)
- Nginx or Apache
- PHP-FPM 8.1 or later
- MySQL 8.0 or later
- Redis
- SSL certificate
- Domain name configured

## Local Deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone [your-repo-url]
cd niazi-tribe

# Install Node.js dependencies
npm install

# Install PHP dependencies
cd apps/php-api
composer install
cd ../..

# Copy and configure environment files
cp .env.example .env
cp apps/php-api/.env.example apps/php-api/.env
cp apps/ui/.env.example apps/ui/.env
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE niazi_tribe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Import schema
mysql -u root -p niazi_tribe < apps/php-api/src/database/schema.sql
```

### 3. Configure Environment Variables

Edit the following files:

#### apps/php-api/.env
```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=niazi_tribe
DB_USERNAME=your_username
DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379

APP_KEY=generate_a_random_32_char_string
APP_DEBUG=true
APP_URL=http://localhost:8000
```

#### apps/ui/.env
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 4. Start Development Servers

```bash
# Start all services in development mode
npm run dev

# Or start services individually:
# Frontend
cd apps/ui
npm run dev

# Backend
cd apps/php-api
php -S localhost:8000 -t public
```

### 5. Local Testing

1. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000

2. Run test suites:
```bash
# Run all tests
npm run test

# Run specific tests
cd apps/ui
npm run test
cd ../php-api
composer test
```

3. Test key features:
   - User registration/login
   - Family tree creation
   - Data import/export
   - Real-time updates
   - Admin features

## Production Deployment

### 1. Server Setup

1. Update system and install dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx mysql-server php8.1-fpm php8.1-mysql php8.1-redis redis-server
```

2. Secure MySQL:
```bash
sudo mysql_secure_installation
```

3. Configure Nginx:
```nginx
# /etc/nginx/sites-available/niazi-tribe
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/niazi-tribe/apps/php-api/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

4. Enable HTTPS with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. Application Deployment

1. Clone and setup:
```bash
cd /var/www
git clone [your-repo-url] niazi-tribe
cd niazi-tribe

# Install dependencies
npm install --production
cd apps/php-api
composer install --no-dev
cd ../ui
npm install --production
```

2. Build frontend:
```bash
cd /var/www/niazi-tribe/apps/ui
npm run build
```

3. Configure environment:
```bash
# Set production environment variables
vim apps/php-api/.env
vim apps/ui/.env
```

4. Set permissions:
```bash
sudo chown -R www-data:www-data /var/www/niazi-tribe
sudo chmod -R 755 /var/www/niazi-tribe
```

### 3. Database Migration

```bash
# Create production database
mysql -u root -p
CREATE DATABASE niazi_tribe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'niazi_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON niazi_tribe.* TO 'niazi_user'@'localhost';
FLUSH PRIVILEGES;
exit

# Import schema
mysql -u niazi_user -p niazi_tribe < apps/php-api/src/database/schema.sql
```

### 4. Setup Process Manager

1. Install PM2:
```bash
sudo npm install -g pm2
```

2. Configure PM2:
```bash
cd /var/www/niazi-tribe
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 5. Monitoring Setup

1. Configure monitoring service:
```bash
# Edit monitoring configuration
vim apps/php-api/src/config/monitoring.php

# Set up log rotation
sudo vim /etc/logrotate.d/niazi-tribe
```

2. Setup backup system:
```bash
# Configure backup script
vim scripts/backup-system.ps1

# Schedule backup task
./scripts/schedule-backup.ps1
```

### 6. Security Measures

1. Configure firewall:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. Set up rate limiting:
```bash
# Configure in Nginx
vim /etc/nginx/sites-available/niazi-tribe
```

3. Enable security headers:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options "nosniff";
```

### 7. Testing Production Deployment

1. Verify application access:
   - Frontend: https://your-domain.com
   - API: https://api.your-domain.com

2. Test all features:
   - User authentication
   - Data operations
   - File uploads
   - Export functionality
   - Admin dashboard

3. Monitor system health:
   - Check logs: `/var/log/niazi-tribe/`
   - Monitor resources: `htop`, `df -h`
   - Check services: `systemctl status nginx php8.1-fpm mysql redis`

### 8. Maintenance

1. Regular updates:
```bash
cd /var/www/niazi-tribe
git pull
npm install
cd apps/php-api
composer install
cd ../ui
npm install
npm run build
```

2. Database backup:
```bash
# Manual backup
./scripts/backup-system.ps1

# Verify automated backups
ls -l /path/to/backup/directory
```

3. Log rotation:
```bash
# Check log rotation status
cat /var/log/syslog | grep niazi-tribe
```

4. SSL certificate renewal:
```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check PHP-FPM status
   - Verify Nginx configuration
   - Check application logs

2. **Database Connection Issues**
   - Verify MySQL credentials
   - Check MySQL service status
   - Test connection manually

3. **File Permission Issues**
   - Verify ownership: `ls -l /var/www/niazi-tribe`
   - Check PHP-FPM user
   - Adjust permissions if needed

### Debug Mode

To enable debug mode:

1. Edit PHP API configuration:
```php
// apps/php-api/src/config/app.php
'debug' => true
```

2. Check logs:
```bash
tail -f /var/log/niazi-tribe/error.log
```

## Support

For issues or assistance:
- Email: support@niazitribe.com
- Create issue in repository
- Check documentation in `/docs` directory 