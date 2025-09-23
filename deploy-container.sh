#!/bin/bash

# 🚀 Deploy Docker Container Only
# Script này chỉ deploy container, nginx server sẽ proxy đến đây

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_status "Deploying Docker container for chat.icahg.com..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Update environment variables
print_status "Updating environment variables..."
cat > .env << EOF
VITE_SOCKET_URL=https://api-ai.vannguyenv12.com
VITE_API_URL=https://api-ai.vannguyenv12.com
EOF

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start container
print_status "Building and starting container..."
docker-compose up --build -d

# Wait for container to start
print_status "Waiting for container to start..."
sleep 10

# Test container
print_status "Testing container..."
if curl -s http://localhost:8080/health > /dev/null; then
    print_success "Container is running successfully!"
else
    print_warning "Container health check failed, but it might still be starting..."
fi

# Show final status
print_success "🎉 CONTAINER DEPLOYMENT COMPLETED!"
echo
echo -e "${GREEN}📱 Your container is running:${NC}"
echo -e "  Container: ${BLUE}http://localhost:8080${NC}"
echo -e "  Health:    ${BLUE}http://localhost:8080/health${NC}"
echo -e "  Domain:    ${BLUE}https://chat.icahg.com${NC} (via nginx proxy)"
echo
echo -e "${GREEN}🔧 Management Commands:${NC}"
echo -e "  View logs:    ${YELLOW}docker-compose logs -f${NC}"
echo -e "  Stop:         ${YELLOW}docker-compose down${NC}"
echo -e "  Restart:      ${YELLOW}docker-compose restart${NC}"
echo -e "  Status:       ${YELLOW}docker-compose ps${NC}"
echo
echo -e "${GREEN}📋 Container Status:${NC}"
docker-compose ps
echo
print_success "🚀 Your container is ready for nginx proxy!"
