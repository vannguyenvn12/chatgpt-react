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
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. This is not recommended but allowed."
    print_status "Continuing with root privileges..."
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p certbot/www
mkdir -p certbot/conf
mkdir -p certbot/logs

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose-https.yml down -v --remove-orphans 2>/dev/null || true

# Start nginx proxy first (HTTP only)
print_status "Starting nginx proxy (HTTP only)..."
docker-compose -f docker-compose-https.yml up -d nginx-proxy frontend

# Wait for nginx to be ready
print_status "Waiting for nginx to be ready..."
sleep 10

# Test HTTP access
print_status "Testing HTTP access..."
if curl -s -o /dev/null -w "%{http_code}" http://chat.icahg.com | grep -q "200\|301\|302"; then
    print_success "HTTP access working!"
else
    print_warning "HTTP access test failed. Continuing anyway..."
fi

# Get SSL certificate
print_status "Getting SSL certificate from Let's Encrypt..."
docker-compose -f docker-compose-https.yml run --rm certbot

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully!"
    
    # Update nginx config to use HTTPS
    print_status "Updating nginx config to use HTTPS..."
    cat > nginx-proxy.conf << 'EOF'
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
    
    # Proxy to frontend container
    location / {
        proxy_pass http://frontend:80;
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
    
    # Restart nginx with HTTPS config
    print_status "Restarting nginx with HTTPS config..."
    docker-compose -f docker-compose-https.yml restart nginx-proxy
    
    # Wait for nginx to be ready
    print_status "Waiting for nginx to be ready..."
    sleep 10
    
    # Test HTTPS access
    print_status "Testing HTTPS access..."
    if curl -s -o /dev/null -w "%{http_code}" https://chat.icahg.com | grep -q "200"; then
        print_success "HTTPS access working!"
    else
        print_warning "HTTPS access test failed. Check logs for details."
    fi
    
    # Setup auto-renewal
    print_status "Setting up SSL certificate auto-renewal..."
    cat > /etc/cron.d/certbot-renew << EOF
0 12 * * * root docker-compose -f $(pwd)/docker-compose-https.yml run --rm certbot renew --quiet --deploy-hook "docker-compose -f $(pwd)/docker-compose-https.yml restart nginx-proxy"
EOF
    
    print_success "🎉 HTTPS deployment completed successfully!"
    echo ""
    print_status "Your application is available at:"
    echo "  🌐 Frontend: https://chat.icahg.com"
    echo "  🔒 SSL: Let's Encrypt certificate"
    echo ""
    print_status "API Configuration:"
    echo "  📡 API URL: https://api-ai.vannguyenv12.com"
    echo "  🔌 Socket URL: https://api-ai.vannguyenv12.com"
    echo ""
    print_status "Management commands:"
    echo "  📊 View logs: docker-compose -f docker-compose-https.yml logs -f"
    echo "  🔄 Restart: docker-compose -f docker-compose-https.yml restart"
    echo "  🛑 Stop: docker-compose -f docker-compose-https.yml down"
    echo "  🚀 Start: docker-compose -f docker-compose-https.yml up -d"
    
else
    print_error "Failed to obtain SSL certificate!"
    print_status "Check your domain DNS settings and try again."
    print_status "Make sure chat.icahg.com points to this server's IP address."
    exit 1
fi
