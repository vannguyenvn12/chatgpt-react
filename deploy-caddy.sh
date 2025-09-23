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
docker-compose -f docker-compose-caddy.yml down -v --remove-orphans 2>/dev/null || true

# Start Docker containers
print_status "Starting Docker containers..."
docker-compose -f docker-compose-caddy.yml up -d

# Wait for containers to be ready
print_status "Waiting for containers to be ready..."
sleep 10

# Check if containers are running
print_status "Checking container status..."
if docker-compose -f docker-compose-caddy.yml ps | grep -q "Up"; then
    print_success "Docker containers are running!"
    
    # Stop Caddy temporarily
    print_status "Stopping Caddy temporarily..."
    systemctl stop caddy
    
    # Start nginx for Let's Encrypt challenge
    print_status "Starting nginx for Let's Encrypt challenge..."
    systemctl start nginx
    
    # Get SSL certificate
    print_status "Getting SSL certificate from Let's Encrypt..."
    certbot certonly --webroot --webroot-path=/var/www/certbot --email npnv.vn1@gmail.com --agree-tos --no-eff-email -d chat.icahg.com
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully!"
        
        # Stop nginx
        print_status "Stopping nginx..."
        systemctl stop nginx
        
        # Configure Caddy
        print_status "Configuring Caddy..."
        cp Caddyfile /etc/caddy/Caddyfile
        
        # Start Caddy
        print_status "Starting Caddy..."
        systemctl start caddy
        systemctl enable caddy
        
        print_success "🎉 Caddy deployment completed successfully!"
        echo ""
        print_status "Your application is available at:"
        echo "  🌐 Frontend: https://chat.icahg.com"
        echo "  🔒 SSL: Let's Encrypt certificate (managed by Caddy)"
        echo ""
        print_status "API Configuration:"
        echo "  📡 API URL: https://api-ai.vannguyenv12.com"
        echo "  🔌 Socket URL: https://api-ai.vannguyenv12.com"
        echo ""
        print_status "Management commands:"
        echo "  📊 View Docker logs: docker-compose -f docker-compose-caddy.yml logs -f"
        echo "  📊 View Caddy logs: journalctl -u caddy -f"
        echo "  🔄 Restart Docker: docker-compose -f docker-compose-caddy.yml restart"
        echo "  🔄 Restart Caddy: systemctl restart caddy"
        echo "  🛑 Stop all: docker-compose -f docker-compose-caddy.yml down && systemctl stop caddy"
        echo "  🚀 Start all: docker-compose -f docker-compose-caddy.yml up -d && systemctl start caddy"
        
    else
        print_error "Failed to obtain SSL certificate!"
        print_status "Check the logs above for details."
        exit 1
    fi
    
else
    print_error "Some Docker containers failed to start!"
    print_status "Checking logs..."
    docker-compose -f docker-compose-caddy.yml logs
    exit 1
fi
