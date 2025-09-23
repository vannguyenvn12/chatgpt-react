# 🚀 ChatGPT React Frontend - Docker Deploy

## 📋 Tổng quan

Deploy ứng dụng React ChatGPT frontend với Docker, SSL tự động, kết nối với API external tại `https://api-ai.vannguyenv12.com/`.

## 🏗️ Kiến trúc

- **Frontend**: React app với Vite
- **Web Server**: Nginx Alpine với SSL
- **Domain**: `https://chat.icahg.com`
- **API**: External API tại `https://api-ai.vannguyenv12.com/`
- **SSL**: Let's Encrypt certificates
- **Container**: Docker với multi-stage build

## 🚀 Quick Start

### Bước 1: Chuẩn bị

```bash
# Vào thư mục frontend
cd chatgpt-react

# Cấp quyền cho script
chmod +x deploy.sh
```

### Bước 2: Deploy (1 lệnh duy nhất)

```bash
# Chạy script deploy
sudo ./deploy.sh
```

Script sẽ:
- Kiểm tra Docker và Docker Compose
- Hỏi email cho Let's Encrypt
- Tạo file `.env` với API URL
- Lấy SSL certificate cho `chat.icahg.com`
- Build và chạy container với HTTPS
- Setup auto-renewal cho SSL

### Bước 3: Cấu hình DNS

Trước khi chạy script, đảm bảo:
- Domain `chat.icahg.com` trỏ về IP server của bạn
- Ports 80 và 443 mở

## 🎯 Kết quả

Sau khi deploy thành công:

- **Frontend**: `https://chat.icahg.com`
- **Health Check**: `https://chat.icahg.com/health`
- **API**: `https://api-ai.vannguyenv12.com/`
- **SSL**: Tự động từ Let's Encrypt

## 🔧 Quản lý

### Xem logs
```bash
docker-compose logs -f
```

### Dừng service
```bash
docker-compose down
```

### Khởi động lại
```bash
docker-compose restart
```

### Xem trạng thái
```bash
docker-compose ps
```

### Rebuild và restart
```bash
docker-compose down
docker-compose up --build -d
```

## 📁 Cấu trúc file

```
chatgpt-react/
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Docker Compose config với SSL
├── nginx.conf              # Nginx configuration với HTTPS
├── deploy.sh               # Deploy script (1 lệnh duy nhất)
├── README.md               # This file
├── certbot/                # SSL certificates (auto-created)
│   ├── conf/
│   └── www/
└── src/                    # React source code
```

## ⚙️ Cấu hình

### Environment Variables

File `.env` sẽ được tạo tự động với:

```env
VITE_SOCKET_URL=https://api-ai.vannguyenv12.com
VITE_API_URL=https://api-ai.vannguyenv12.com
```

### Nginx Configuration

- **Ports**: 80 (HTTP redirect), 443 (HTTPS)
- **Domain**: `chat.icahg.com`
- **SSL**: Let's Encrypt certificates
- **Gzip**: Enabled
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **React Router**: SPA support
- **Static Assets**: 1 year cache
- **API Proxy**: Optional proxy to external API

### Docker Configuration

- **Base Image**: Node.js 18 Alpine (builder) + Nginx Alpine (production)
- **Ports**: 80, 443
- **Volumes**: SSL certificates, certbot webroot
- **Health Check**: HTTP check every 30s
- **Restart Policy**: unless-stopped
- **SSL**: Let's Encrypt integration

## 🔍 Troubleshooting

### Service không start
```bash
# Check logs
docker-compose logs

# Check container status
docker-compose ps

# Rebuild
docker-compose down
docker-compose up --build -d
```

### API connection issues
```bash
# Test API directly
curl https://api-ai.vannguyenv12.com/

# Check environment variables
docker-compose exec frontend env | grep VITE
```

### Port conflicts
```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx    # if nginx is running
```

### Permission issues
```bash
# Fix script permissions
chmod +x deploy.sh

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
# Logout and login again
```

## 📊 Monitoring

### Health Check
```bash
# Test health endpoint
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

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Update API URL
```bash
# Edit .env file
nano .env

# Update VITE_API_URL and VITE_SOCKET_URL
# Restart container
docker-compose restart
```

## 🆘 Support

Nếu gặp vấn đề:

1. **Check logs**: `docker-compose logs -f`
2. **Check API**: `curl https://api-ai.vannguyenv12.com/`
3. **Check health**: `curl https://chat.icahg.com/health`
4. **Rebuild**: `docker-compose down && docker-compose up --build -d`

## 📝 Notes

- Script deploy sẽ tự động tạo file `.env`
- Nginx config hỗ trợ React Router và HTTPS
- SSL certificate tự động từ Let's Encrypt
- Auto-renewal SSL được setup tự động
- Có thể proxy API qua nginx nếu cần
- Health check endpoint: `/health`
- Static assets được cache 1 năm
- Domain: `https://chat.icahg.com`

## 🔒 SSL Features

- **Let's Encrypt**: Free SSL certificates
- **Auto-renewal**: Tự động gia hạn
- **HTTP/2**: Modern protocol
- **Security Headers**: HSTS, CSP, etc.
- **Strong Ciphers**: TLS 1.2/1.3 only

Chúc bạn deploy thành công với SSL! 🎉