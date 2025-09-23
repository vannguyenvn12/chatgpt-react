#!/bin/bash

# 🚀 Simple Frontend Deploy Script - ChatGPT React
# Script này sẽ deploy chỉ frontend React để gọi API external

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
    echo -e "${PURPLE}🚀 Deploy Frontend React - ChatGPT${NC}"
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    print_status "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    print_status "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

print_status "Docker and Docker Compose are installed!"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found!"
    print_status "Please run this script from the chatgpt-react directory."
    exit 1
fi

# Get domain from user (optional)
read -p "Enter your domain name (or press Enter for localhost): " DOMAIN

if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
    print_status "Using localhost as domain"
else
    print_status "Using domain: $DOMAIN"
fi

# Update environment variables
print_status "Updating environment variables..."
cat > .env << EOF
VITE_SOCKET_URL=https://api-ai.vannguyenv12.com
VITE_API_URL=https://api-ai.vannguyenv12.com
EOF

print_success "Environment variables updated!"

# Build and start the frontend
print_status "Building and starting frontend..."
docker-compose down
docker-compose up --build -d

# Wait for service to start
print_status "Waiting for frontend to start..."
sleep 10

# Test the deployment
print_status "Testing deployment..."
if curl -s http://localhost/health > /dev/null; then
    print_success "Frontend is running successfully!"
else
    print_warning "Health check failed, but service might still be starting..."
fi

# Show final status
print_success "🎉 FRONTEND DEPLOYMENT COMPLETED!"
echo
echo -e "${GREEN}📱 Your ChatGPT Frontend is now running:${NC}"
if [ "$DOMAIN" = "localhost" ]; then
    echo -e "  Frontend: ${BLUE}http://localhost${NC}"
    echo -e "  Health:   ${BLUE}http://localhost/health${NC}"
else
    echo -e "  Frontend: ${BLUE}http://$DOMAIN${NC}"
    echo -e "  Health:   ${BLUE}http://$DOMAIN/health${NC}"
fi
echo -e "  API:      ${BLUE}https://api-ai.vannguyenv12.com${NC}"
echo
echo -e "${GREEN}🔧 Management Commands:${NC}"
echo -e "  View logs:    ${YELLOW}docker-compose logs -f${NC}"
echo -e "  Stop:         ${YELLOW}docker-compose down${NC}"
echo -e "  Restart:      ${YELLOW}docker-compose restart${NC}"
echo -e "  Status:       ${YELLOW}docker-compose ps${NC}"
echo
echo -e "${GREEN}📋 Service Status:${NC}"
docker-compose ps
echo
print_success "🚀 Your ChatGPT frontend is ready to use!"
