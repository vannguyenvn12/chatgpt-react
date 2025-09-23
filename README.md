# ChatGPT React Frontend

React frontend application for ChatGPT with Docker deployment using Traefik reverse proxy.

## 🚀 Quick Start

**Chỉ cần 1 lệnh duy nhất:**

```bash
./deploy.sh
```

## 📋 Prerequisites

- Docker và Docker Compose
- Domain `chat.icahg.com` trỏ về server
- Port 80 và 443 mở

## 🏗️ Architecture

```
Internet → Traefik (Port 80/443) → React Container (Port 80)
                ↓
         SSL Certificate (Let's Encrypt)
                ↓
         API Calls → https://api-ai.vannguyenv12.com
```

## 🔧 Features

- ✅ **Traefik Reverse Proxy** - Tự động SSL, load balancing
- ✅ **Let's Encrypt SSL** - Tự động gia hạn certificate
- ✅ **Docker Compose** - 1 lệnh deploy toàn bộ
- ✅ **Auto HTTPS Redirect** - HTTP → HTTPS
- ✅ **Health Checks** - Monitoring tự động
- ✅ **Zero Configuration** - Không cần cấu hình nginx

## 📁 File Structure

```
chatgpt-react/
├── docker-compose.yml      # Main deployment file
├── traefik/
│   └── traefik.yml         # Traefik configuration
├── certbot/                # SSL certificates (auto-created)
├── deploy.sh              # One-command deployment
├── Dockerfile             # React app container
├── nginx.conf             # Nginx config for container
└── README.md              # This file
```

## 🌐 Access Points

- **Frontend**: https://chat.icahg.com
- **Traefik Dashboard**: http://localhost:8080
- **API**: https://api-ai.vannguyenv12.com

## 🛠️ Management Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Start services
docker-compose up -d

# Rebuild and start
docker-compose up -d --build
```

## 🔍 Troubleshooting

### SSL Certificate Issues
```bash
# Check Traefik logs
docker-compose logs traefik

# Check certificate status
docker-compose exec traefik traefik version
```

### Container Issues
```bash
# Check all containers
docker-compose ps

# Check specific service logs
docker-compose logs frontend
```

### Port Conflicts
```bash
# Check what's using ports 80/443
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop nginx apache2
```

## 🔒 Security Features

- **Automatic HTTPS** - All traffic encrypted
- **HSTS Headers** - Force HTTPS in browsers
- **Security Headers** - XSS, CSRF protection
- **Rate Limiting** - DDoS protection
- **Auto Certificate Renewal** - No downtime

## 📊 Monitoring

### Health Checks
- Container health: `docker-compose ps`
- Traefik dashboard: http://localhost:8080
- Application logs: `docker-compose logs -f`

### SSL Certificate Status
```bash
# Check certificate expiry
echo | openssl s_client -servername chat.icahg.com -connect chat.icahg.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 🚀 Deployment Process

1. **Clone repository**
2. **Run deployment**: `./deploy.sh`
3. **Wait for SSL**: 2-5 minutes
4. **Access application**: https://chat.icahg.com

## 🔄 Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify domain DNS: `nslookup chat.icahg.com`
3. Check ports: `sudo netstat -tulpn | grep :80`
4. Restart services: `docker-compose restart`

## 🎯 Benefits of Traefik

- **Zero Configuration** - No nginx config needed
- **Automatic SSL** - Let's Encrypt integration
- **Service Discovery** - Auto-detect containers
- **Load Balancing** - Built-in load balancer
- **Health Checks** - Automatic failover
- **Dashboard** - Web UI for monitoring