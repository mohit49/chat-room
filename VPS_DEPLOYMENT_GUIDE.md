# VPS Deployment Guide

This guide will help you deploy your chat app to a VPS with automatic localhost/domain configuration.

## Prerequisites

- VPS with Ubuntu/Debian
- Domain name pointing to your VPS
- SSL certificate (Let's Encrypt recommended)
- Node.js and npm installed
- MongoDB installed
- Nginx installed

## Quick Setup

### 1. Environment Configuration

```bash
# Copy the environment template
npm run setup:prod

# Edit the production environment file
nano .env.production
```

Update `.env.production` with your domain:
```env
NODE_ENV=production
PORT=3001
DOMAIN=yourdomain.com
USE_HTTPS=true
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
DATABASE_URL=mongodb://localhost:27017/chat-app-prod
JWT_SECRET=your-super-secure-production-secret-key
ADDITIONAL_CORS_ORIGINS=https://yourdomain.com,http://yourdomain.com,https://www.yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### 2. Build and Deploy

```bash
# Build the application
npm run build

# Start with domain configuration
npm run start:domain
```

### 3. Nginx Configuration

Create `/etc/nginx/sites-available/chat-app`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Process Management (PM2)

Install PM2 for process management:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'chat-app-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'chat-app-backend',
      script: 'tsx',
      args: 'server/index.ts',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Development vs Production

### Local Development
- Uses `localhost:3000` for frontend
- Uses `localhost:3001` for backend
- Automatically detects development environment
- CORS allows localhost and network IPs

### Production (VPS)
- Uses your domain for both frontend and backend
- Automatically enables HTTPS
- CORS configured for your domain
- SSL certificates handled by Nginx

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| `DOMAIN` | Not needed | `yourdomain.com` |
| `USE_HTTPS` | `false` | `true` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| `BACKEND_URL` | `http://localhost:3001` | `https://yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | `https://yourdomain.com/api` |

## Troubleshooting

### CORS Issues
- Check that your domain is in `CORS_ORIGIN` and `ADDITIONAL_CORS_ORIGINS`
- Verify Nginx is proxying correctly
- Check browser console for specific CORS errors

### SSL Issues
- Ensure SSL certificates are valid
- Check Nginx SSL configuration
- Verify domain DNS settings

### Socket.io Issues
- Ensure `/socket.io/` location is configured in Nginx
- Check that Socket.io is using the correct URL
- Verify WebSocket upgrade headers

## Quick Commands

```bash
# Local development
npm run dev:local

# Production build
npm run build

# Production start
npm run start:domain

# Setup environment files
npm run setup:local    # For development
npm run setup:prod     # For production
```
