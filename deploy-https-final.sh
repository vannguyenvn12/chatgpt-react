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

# Start Docker containers
print_status "Starting Docker containers..."
docker-compose -f docker-compose-https.yml up -d

# Wait for containers to be ready
print_status "Waiting for containers to be ready..."
sleep 10

# Check if containers are running
print_status "Checking container status..."
if docker-compose -f docker-compose-https.yml ps | grep -q "Up"; then
    print_success "Docker containers are running!"
    
    # Setup host nginx
    print_status "Setting up host nginx reverse proxy..."
    chmod +x setup-host-nginx.sh
    ./setup-host-nginx.sh
    
    if [ $? -eq 0 ]; then
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
        echo "  📊 View Docker logs: docker-compose -f docker-compose-https.yml logs -f"
        echo "  📊 View nginx logs: journalctl -u nginx -f"
        echo "  🔄 Restart Docker: docker-compose -f docker-compose-https.yml restart"
        echo "  🔄 Restart nginx: systemctl restart nginx"
        echo "  🛑 Stop all: docker-compose -f docker-compose-https.yml down && systemctl stop nginx"
        echo "  🚀 Start all: docker-compose -f docker-compose-https.yml up -d && systemctl start nginx"
        
    else
        print_error "Failed to setup host nginx!"
        print_status "Check the nginx setup logs above for details."
        exit 1
    fi
    
else
    print_error "Some Docker containers failed to start!"
    print_status "Checking logs..."
    docker-compose -f docker-compose-https.yml logs
    exit 1
fi
