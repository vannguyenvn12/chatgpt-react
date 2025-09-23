# 🚀 ChatGPT React Frontend - Docker Deploy

## 📋 Tổng quan

Deploy ứng dụng React ChatGPT frontend với Docker, sử dụng nginx reverse proxy để truy cập qua domain `https://chat.icahg.com`.

## 🏗️ Kiến trúc

- **Frontend**: React app với Vite
- **Container**: Docker chạy trên port 8080
- **Nginx Proxy**: Server host proxy từ `https://chat.icahg.com` → `http://localhost:8080`
- **Domain**: `https://chat.icahg.com`
- **API**: External API tại `https://api-ai.vannguyenv12.com/`
- **SSL**: Let's Encrypt certificates

## 🚀 Quick Start

### Bước 1: Deploy Container

```bash
# Vào thư mục frontend
cd chatgpt-react

# Cấp quyền cho script
chmod +x deploy-simple.sh

# Deploy container
./deploy-simple.sh
```

### Bước 2: Setup Nginx Proxy

```bash
# Cấp quyền cho script
chmod +x setup-nginx-proxy.sh

# Setup nginx reverse proxy với SSL
sudo ./setup-nginx-proxy.sh
```

### Bước 3: Cấu hình DNS

Trước khi chạy script, đảm bảo:
- Domain `chat.icahg.com` trỏ về IP server của bạn
- Ports 80 và 443 mở

## 🎯 Kết quả

Sau khi deploy thành công:

- **Frontend**: `https://chat.icahg.com`
- **Health Check**: `https://chat.icahg.com/health`
- **Container**: `http://localhost:8080`
- **API**: `https://api-ai.vannguyenv12.com/`
- **SSL**: Tự động từ Let's Encrypt

## 🔧 Quản lý

### Container Management
```bash
# Xem logs
docker-compose logs -f

# Dừng container
docker-compose down

# Khởi động lại
docker-compose restart

# Xem trạng thái
docker-compose ps
```

### Nginx Management
```bash
# Xem nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx

# Test nginx config
sudo nginx -t
```

## 📁 Cấu trúc file

```
chatgpt-react/
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Docker Compose config (port 8080)
├── nginx-simple.conf       # Nginx config cho container
├── deploy-simple.sh        # Deploy container script
├── setup-nginx-proxy.sh    # Setup nginx proxy script
├── README.md               # This file
└── src/                    # React source code
```

## ⚙️ Cấu hình

### Environment Variables

File `.env` sẽ được tạo tự động với:

```env
VITE_SOCKET_URL=https://api-ai.vannguyenv12.com
VITE_API_URL=https://api-ai.vannguyenv12.com
```

### Docker Configuration

- **Base Image**: Node.js 18 Alpine (builder) + Nginx Alpine (production)
- **Port**: 8080:80 (tránh xung đột port 80)
- **Health Check**: HTTP check every 30s
- **Restart Policy**: unless-stopped

### Nginx Proxy Configuration

- **Ports**: 80 (HTTP redirect), 443 (HTTPS)
- **Domain**: `chat.icahg.com`
- **SSL**: Let's Encrypt certificates
- **Proxy**: `https://chat.icahg.com` → `http://localhost:8080`
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.

## 🔍 Troubleshooting

### Container không start
```bash
# Check logs
docker-compose logs

# Check container status
docker-compose ps

# Rebuild
docker-compose down
docker-compose up --build -d
```

### Nginx proxy không hoạt động
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
curl -I https://chat.icahg.com/health
```

### Port conflicts
```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx    # if nginx is running
```

## 📊 Monitoring

### Health Check
```bash
# Test container
curl http://localhost:8080/health

# Test domain
curl https://chat.icahg.com/health

# Expected response: "frontend healthy"
```

### Container Stats
```bash
# View container stats
docker stats chatgpt-frontend

# View container logs
docker logs chatgpt-frontend
```

## 🔄 Updates

### Update code
```bash
# Pull latest changes
git pull

# Rebuild and restart container
docker-compose down
docker-compose up --build -d
```

### Update nginx config
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/chat.icahg.com

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## 🆘 Support

Nếu gặp vấn đề:

1. **Check container**: `docker-compose logs -f`
2. **Check nginx**: `sudo systemctl status nginx`
3. **Check SSL**: `sudo certbot certificates`
4. **Test domain**: `curl https://chat.icahg.com/health`
5. **Rebuild**: `docker-compose down && docker-compose up --build -d`

## 📝 Notes

- Container chạy trên port 8080 để tránh xung đột
- Nginx proxy xử lý SSL và domain routing
- SSL certificate tự động từ Let's Encrypt
- Auto-renewal SSL được setup tự động
- Health check endpoint: `/health`
- Static assets được cache 1 năm
- Domain: `https://chat.icahg.com`

## 🔒 SSL Features

- **Let's Encrypt**: Free SSL certificates
- **Auto-renewal**: Tự động gia hạn
- **HTTP/2**: Modern protocol
- **Security Headers**: HSTS, CSP, etc.
- **Strong Ciphers**: TLS 1.2/1.3 only

Chúc bạn deploy thành công! 🎉