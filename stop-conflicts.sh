#!/bin/bash

# 🔧 Stop Port Conflicts Script
echo "🔍 Checking for port conflicts..."

# Stop any existing chatgpt containers
echo "Stopping existing chatgpt containers..."
docker-compose down 2>/dev/null || true

# Stop any containers using port 80 or 443
echo "Stopping containers using ports 80/443..."
docker ps -q --filter "publish=80" | xargs -r docker stop 2>/dev/null || true
docker ps -q --filter "publish=443" | xargs -r docker stop 2>/dev/null || true

# Check what's still using the ports
echo "Checking remaining port usage..."
if command -v netstat &> /dev/null; then
    echo "Port 80:"
    netstat -tulpn | grep :80 || echo "  Port 80 is free"
    echo "Port 443:"
    netstat -tulpn | grep :443 || echo "  Port 443 is free"
fi

echo "✅ Ready to start with: docker-compose up --build -d"
