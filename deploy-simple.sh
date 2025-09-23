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

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose-simple.yml down -v --remove-orphans 2>/dev/null || true

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose-simple.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
print_status "Checking service status..."
if docker-compose -f docker-compose-simple.yml ps | grep -q "Up"; then
    print_success "Services are running!"
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your application is available at:"
    echo "  🌐 Frontend: http://your-server-ip:3000"
    echo "  🌐 Frontend: http://chat.icahg.com:3000 (if DNS configured)"
    echo ""
    print_status "API Configuration:"
    echo "  📡 API URL: https://api-ai.vannguyenv12.com"
    echo "  🔌 Socket URL: https://api-ai.vannguyenv12.com"
    echo ""
    print_status "Management commands:"
    echo "  📊 View logs: docker-compose -f docker-compose-simple.yml logs -f"
    echo "  🔄 Restart: docker-compose -f docker-compose-simple.yml restart"
    echo "  🛑 Stop: docker-compose -f docker-compose-simple.yml down"
    echo "  🚀 Start: docker-compose -f docker-compose-simple.yml up -d"
    echo ""
    print_warning "Note: This is HTTP only. For HTTPS, you need to setup SSL separately."
    
else
    print_error "Some services failed to start!"
    print_status "Checking logs..."
    docker-compose -f docker-compose-simple.yml logs
    exit 1
fi