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
    print_error "Please don't run this script as root!"
    print_status "Run: ./deploy.sh"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_warning "Please logout and login again, then run this script again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed!"
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p traefik
mkdir -p certbot

# Set proper permissions
print_status "Setting permissions..."
chmod 600 certbot/acme.json 2>/dev/null || true

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down -v --remove-orphans 2>/dev/null || true

# Build and start services
print_status "Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
print_status "Checking service status..."
if docker-compose ps | grep -q "Up"; then
    print_success "Services are running!"
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your application is available at:"
    echo "  🌐 Frontend: https://chat.icahg.com"
    echo "  🔧 Traefik Dashboard: http://localhost:8080"
    echo ""
    print_status "API Configuration:"
    echo "  📡 API URL: https://api-ai.vannguyenv12.com"
    echo "  🔌 Socket URL: https://api-ai.vannguyenv12.com"
    echo ""
    print_status "Management commands:"
    echo "  📊 View logs: docker-compose logs -f"
    echo "  🔄 Restart: docker-compose restart"
    echo "  🛑 Stop: docker-compose down"
    echo "  🚀 Start: docker-compose up -d"
    echo ""
    print_warning "Note: SSL certificate will be automatically obtained by Traefik"
    print_warning "It may take a few minutes for HTTPS to be fully available"
    
else
    print_error "Some services failed to start!"
    print_status "Checking logs..."
    docker-compose logs
    exit 1
fi