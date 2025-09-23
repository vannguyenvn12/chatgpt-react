#!/bin/bash

# 🚀 Deploy ChatGPT React với SSL - 1 lệnh duy nhất
# Script này sẽ deploy toàn bộ với SSL trong 1 lệnh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}🚀 Deploy ChatGPT React với SSL${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

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

print_header

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed!"

# Get email from user
read -p "Enter your email for Let's Encrypt: " EMAIL

if [ -z "$EMAIL" ]; then
    print_error "Email is required for SSL certificate!"
    exit 1
fi

print_status "Using email: $EMAIL for SSL certificate"

# Update docker-compose.yml with email
print_status "Updating docker-compose.yml with email..."
sed -i "s/your-email@example.com/$EMAIL/g" docker-compose.yml

# Update environment variables
print_status "Updating environment variables..."
cat > .env << EOF
VITE_SOCKET_URL=https://api-ai.vannguyenv12.com
VITE_API_URL=https://api-ai.vannguyenv12.com
EOF

print_success "Environment variables updated!"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

# Set proper permissions
chmod -R 755 certbot/

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Start nginx without SSL first
print_status "Starting nginx without SSL for initial certificate..."
docker-compose up -d frontend

# Wait for nginx to start
print_status "Waiting for nginx to start..."
sleep 15

# Get SSL certificate
print_status "Getting SSL certificate from Let's Encrypt..."
certbot certonly \
    --webroot \
    --webroot-path=./certbot/www \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    -d chat.icahg.com

# Check if certificate was obtained
if [ ! -f "/etc/letsencrypt/live/chat.icahg.com/fullchain.pem" ]; then
    print_error "Failed to obtain SSL certificate!"
    print_status "Please check your domain DNS settings and try again."
    print_status "Make sure chat.icahg.com points to this server's IP address."
    exit 1
fi

print_success "SSL certificate obtained successfully!"

# Copy certificate to project directory
print_status "Copying certificate to project directory..."
cp -r /etc/letsencrypt/live/chat.icahg.com ./certbot/conf/
cp -r /etc/letsencrypt/archive/chat.icahg.com ./certbot/conf/

# Start all services with SSL
print_status "Starting all services with SSL..."
docker-compose down
docker-compose up --build -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Test SSL
print_status "Testing SSL configuration..."
if curl -s https://chat.icahg.com/health > /dev/null; then
    print_success "SSL is working correctly!"
else
    print_warning "SSL test failed. Please check the configuration."
fi

# Setup auto-renewal
print_status "Setting up SSL certificate auto-renewal..."
cat > /etc/cron.d/certbot-renew << EOF
0 12 * * * root certbot renew --quiet --deploy-hook "docker-compose -f $(pwd)/docker-compose.yml restart frontend"
EOF

# Show final status
print_success "🎉 DEPLOYMENT WITH SSL COMPLETED SUCCESSFULLY!"
echo
echo -e "${GREEN}📱 Your ChatGPT Frontend is now running with SSL:${NC}"
echo -e "  Frontend: ${BLUE}https://chat.icahg.com${NC}"
echo -e "  Health:   ${BLUE}https://chat.icahg.com/health${NC}"
echo -e "  API:      ${BLUE}https://api-ai.vannguyenv12.com${NC}"
echo
echo -e "${GREEN}🔧 Management Commands:${NC}"
echo -e "  View logs:    ${YELLOW}docker-compose logs -f${NC}"
echo -e "  Stop all:     ${YELLOW}docker-compose down${NC}"
echo -e "  Restart:      ${YELLOW}docker-compose restart${NC}"
echo -e "  Status:       ${YELLOW}docker-compose ps${NC}"
echo
echo -e "${GREEN}📋 Service Status:${NC}"
docker-compose ps
echo
print_success "🚀 Your ChatGPT frontend with SSL is ready to use!"