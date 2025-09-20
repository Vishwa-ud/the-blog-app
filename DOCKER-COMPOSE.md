# Docker Compose Setup Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git repository cloned

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

### 2. Development Setup
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### 3. Production Setup
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 📦 Available Compose Files

### `docker-compose.yml` - Full Stack
- Complete setup with frontend, backend, database, and nginx
- Suitable for local development and testing
- Includes all services

### `docker-compose.dev.yml` - Development
- Simplified setup for backend development
- Hot reload enabled
- Development database
- Redis for caching

### `docker-compose.prod.yml` - Production
- Production-optimized configuration
- Health checks and resource limits
- SSL support
- Backup volumes

## 🛠️ Services Overview

### Backend (Node.js/Express)
- **Port**: 3000
- **Technology**: TypeScript, Express, Prisma
- **Features**: API server, authentication, file uploads

### Frontend (React/Vite) 
- **Port**: 5173 (dev) / 80,443 (prod)
- **Technology**: React, TypeScript, Vite
- **Features**: User interface, responsive design

### Database (PostgreSQL)
- **Port**: 5432
- **Technology**: PostgreSQL 15
- **Features**: Data persistence, migrations

### Cache (Redis)
- **Port**: 6379
- **Technology**: Redis 7
- **Features**: Session storage, caching

### Proxy (Nginx) - Production Only
- **Ports**: 80, 443
- **Technology**: Nginx
- **Features**: Reverse proxy, SSL termination, static file serving

## 🔧 Common Commands

### Database Operations
```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run seed

# Access database shell
docker-compose exec db psql -U postgres -d blogapp

# Backup database
docker-compose exec db pg_dump -U postgres blogapp > backup.sql
```

### Backend Operations
```bash
# View backend logs
docker-compose logs -f backend

# Access backend shell
docker-compose exec backend sh

# Restart backend service
docker-compose restart backend

# Build backend image
docker-compose build backend
```

### Frontend Operations
```bash
# View frontend logs
docker-compose logs -f frontend

# Access frontend shell
docker-compose exec frontend sh

# Restart frontend service
docker-compose restart frontend

# Build frontend image
docker-compose build frontend
```

### Redis Operations
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# View Redis logs
docker-compose logs -f redis

# Flush Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

## 🔒 Security Configuration

### Environment Variables
- Never commit `.env` files to version control
- Use strong passwords and secrets
- Rotate JWT secrets regularly

### Database Security
- Use strong database passwords
- Limit database access to application only
- Regular backups and monitoring

### SSL/TLS (Production)
```bash
# Generate SSL certificates (self-signed for testing)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx.key \
  -out nginx/ssl/nginx.crt
```

## 📊 Monitoring & Logs

### View All Logs
```bash
docker-compose logs -f
```

### View Specific Service Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Monitor Resource Usage
```bash
docker stats
```

### Health Checks
```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3000/health
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Restart database
docker-compose restart db
```

#### Build Issues
```bash
# Clean build
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v
docker system prune -a
```

#### Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER .
```

## 🔄 Development Workflow

### Making Changes
1. Edit source code
2. Changes are automatically reflected (hot reload)
3. Test changes
4. Commit to version control

### Database Changes
1. Edit Prisma schema
2. Generate migration: `docker-compose exec backend npx prisma migrate dev`
3. Apply migration: `docker-compose exec backend npx prisma migrate deploy`

### Adding Dependencies
1. Update package.json
2. Rebuild container: `docker-compose build backend`
3. Restart services: `docker-compose up -d`

## 🚀 Deployment

### Production Deployment
1. Set production environment variables
2. Build production images
3. Deploy using `docker-compose.prod.yml`
4. Set up monitoring and backups

### CI/CD Integration
- Use the compose files in GitHub Actions
- Automated testing with test database
- Deployment to staging/production environments

---

**📝 Note**: This setup is designed to be flexible and scalable. Adjust the configuration based on your specific needs and environment requirements.