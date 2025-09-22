# Nginx Server Integration

This document explains the Nginx server integration for the blog application.

## Overview

The blog application now uses Nginx as a reverse proxy server to:
- Handle HTTPS/SSL termination
- Load balance between services
- Serve static files efficiently
- Provide security headers and rate limiting
- Act as the single entry point for the application

## Architecture

```
User -> Nginx (Port 80/443) -> Backend API (Port 3000)
                            -> Frontend App (Port 5173)
```

## Features

### Security
- **SSL/TLS**: Self-signed certificates for HTTPS
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, CSP, etc.
- **Rate Limiting**: API endpoints limited to 10 req/s, auth endpoints to 5 req/m
- **HTTPS Redirect**: All HTTP traffic redirected to HTTPS

### Performance
- **Gzip Compression**: Enabled for text-based assets
- **Static File Caching**: 1-year cache for static assets
- **HTTP/2**: Enabled for better performance
- **Connection Keep-alive**: Optimized upstream connections

### Routing
- `/api/*` -> Backend API server
- `/api/auth/*` -> Backend with stricter rate limiting
- `/health` -> Backend health check
- `/` -> Frontend React application
- Static files served with optimal caching headers

## Configuration Files

### `/nginx/nginx.conf`
Main Nginx configuration with:
- SSL configuration
- Upstream definitions
- Server blocks for HTTP/HTTPS
- Proxy settings
- Security headers
- Rate limiting rules

### `/nginx/Dockerfile`
- Based on Alpine Linux for minimal size
- Self-signed SSL certificate generation
- Security hardening with non-root user
- Health checks enabled

## Docker Integration

The Nginx service is integrated into all Docker Compose configurations:

### Development (`docker-compose.dev.yml`)
- Uses local database
- Development SSL certificates
- Hot reload support

### Production (`docker-compose.prod.yml`)
- Production optimizations
- Resource limits
- Optimized SSL configuration

### Full Stack (`docker-compose.yml`)
- Complete environment with all services
- Redis caching
- PostgreSQL database

## Usage

### Start with Nginx
```bash
# Development
make dev

# Production
make prod

# Full stack
make full
```

### Access Points
- **Application**: https://localhost
- **API**: https://localhost/api
- **Health Check**: https://localhost/health

### SSL Certificate
The setup uses self-signed certificates for development. For production, you should:
1. Replace with proper SSL certificates from a CA
2. Update the certificate paths in the Dockerfile
3. Consider using Let's Encrypt for automatic certificate management

## Security Features

### Rate Limiting
- API endpoints: 10 requests per second with burst of 20
- Authentication endpoints: 5 requests per minute with burst of 5

### Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: enabled
- Content Security Policy: restrictive policy
- Referrer Policy: strict-origin-when-cross-origin

### SSL Configuration
- TLS 1.2 and 1.3 only
- Strong cipher suites
- Session caching for performance

## Monitoring

### Health Checks
- Nginx container has built-in health check
- Proxies health check requests to backend
- Docker Compose health check integration

### Logs
- Access logs: `/var/log/nginx/access.log`
- Error logs: `/var/log/nginx/error.log`
- Structured logging format for analysis

## Customization

To customize the Nginx configuration:
1. Edit `/nginx/nginx.conf`
2. Rebuild the containers: `make full-build`
3. Monitor logs: `docker-compose logs nginx`

## Production Considerations

For production deployment:
1. **SSL Certificates**: Use proper CA-signed certificates
2. **Domain Configuration**: Update server_name directive
3. **Firewall**: Ensure ports 80 and 443 are properly configured
4. **Monitoring**: Implement proper log analysis and monitoring
5. **Backup**: Regular backup of SSL certificates and configuration
6. **Updates**: Keep Nginx and base images updated

## Troubleshooting

### Common Issues
1. **SSL Certificate Errors**: Check certificate generation in Dockerfile
2. **502 Bad Gateway**: Verify backend service is running
3. **Rate Limiting**: Check if requests exceed configured limits
4. **CORS Issues**: Update CORS settings in backend if needed

### Debug Commands
```bash
# Check Nginx configuration
docker-compose exec nginx nginx -t

# View Nginx logs
docker-compose logs nginx

# Check upstream health
docker-compose exec nginx curl -f http://backend:3000/health
```