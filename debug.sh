#!/bin/bash

echo "=== Debug Traefik Container ==="
echo "1. Checking container status..."
docker-compose ps

echo -e "\n2. Checking Traefik logs..."
docker-compose logs traefik

echo -e "\n3. Checking if acme.json exists and has correct permissions..."
ls -la certbot/acme.json 2>/dev/null || echo "acme.json not found"

echo -e "\n4. Creating acme.json with correct permissions..."
mkdir -p certbot
touch certbot/acme.json
chmod 600 certbot/acme.json

echo -e "\n5. Restarting Traefik..."
docker-compose restart traefik

echo -e "\n6. Waiting 10 seconds..."
sleep 10

echo -e "\n7. Checking status again..."
docker-compose ps

echo -e "\n8. Checking Traefik logs again..."
docker-compose logs traefik --tail=20
