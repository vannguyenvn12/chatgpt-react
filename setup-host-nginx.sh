#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root!"
    print_status "Run: sudo ./setup-host-nginx.sh"
    exit 1
fi

# Install nginx if not installed
print_status "Installing nginx..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Stop nginx
print_status "Stopping nginx..."
systemctl stop nginx

# Create nginx site configuration
print_status "Creating nginx site configuration..."
cat > /etc/nginx/sites-available/chat.icahg.com << 'EOF'
# HTTP server - for Let's Encrypt challenge
server {
    listen 80;
    server_name chat.icahg.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable the site
print_status "Enabling nginx site..."
ln -sf /etc/nginx/sites-available/chat.icahg.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Create certbot directory
print_status "Creating certbot directory..."
mkdir -p /var/www/certbot

# Test nginx configuration
print_status "Testing nginx configuration..."
nginx -t

# Start nginx
print_status "Starting nginx..."
systemctl start nginx
systemctl enable nginx

# Get SSL certificate
print_status "Getting SSL certificate from Let's Encrypt..."
certbot certonly --webroot --webroot-path=/var/www/certbot --email npnv.vn1@gmail.com --agree-tos --no-eff-email -d chat.icahg.com

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully!"
    
    # Update nginx config to use HTTPS
    print_status "Updating nginx config to use HTTPS..."
    cat > /etc/nginx/sites-available/chat.icahg.com << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name chat.icahg.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name chat.icahg.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/chat.icahg.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.icahg.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
    
    # Test nginx configuration
    print_status "Testing nginx configuration..."
    nginx -t
    
    # Reload nginx
    print_status "Reloading nginx..."
    systemctl reload nginx
    
    # Setup auto-renewal
    print_status "Setting up SSL certificate auto-renewal..."
    cat > /etc/cron.d/certbot-renew << EOF
0 12 * * * root certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF
    
    print_success "🎉 Host nginx setup completed successfully!"
    echo ""
    print_status "Your application is available at:"
    echo "  🌐 Frontend: https://chat.icahg.com"
    echo "  🔒 SSL: Let's Encrypt certificate"
    echo ""
    print_status "Docker container runs on:"
    echo "  📦 Frontend: localhost:3000"
    echo "  📦 Nginx Proxy: localhost:8080"
    echo ""
    print_status "Management commands:"
    echo "  📊 View nginx logs: journalctl -u nginx -f"
    echo "  🔄 Restart nginx: systemctl restart nginx"
    echo "  🛑 Stop nginx: systemctl stop nginx"
    echo "  🚀 Start nginx: systemctl start nginx"
    
else
    print_error "Failed to obtain SSL certificate!"
    print_status "Check your domain DNS settings and try again."
    print_status "Make sure chat.icahg.com points to this server's IP address."
    exit 1
fi
