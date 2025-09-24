# Security Implementation Documentation

![Security Status](https://img.shields.io/badge/security-enhanced-brightgreen)
![CI/CD Status](https://img.shields.io/badge/CI%2FCD-automated-blue)
![Docker Scans](https://img.shields.io/badge/docker%20scans-passing-brightgreen)

This document outlines the security implementations in the Blog Application, focusing on SSL/TLS with Nginx, DDoS protection & rate limiting, GitHub Actions security pipelines, and secrets management.

## 📋 Table of Contents

- [SSL/TLS Implementation with Nginx](#ssltls-implementation-with-nginx)
- [DDoS Protection & API Rate Limiting](#ddos-protection--api-rate-limiting)
- [GitHub Actions Security Pipelines](#github-actions-security-pipelines)
- [Secrets Management](#secrets-management)

## 🔒 SSL/TLS Implementation with Nginx

The application uses Nginx as a reverse proxy with robust SSL/TLS implementation to secure all communications between clients and servers, providing encryption, data integrity, and authentication.

### Key Features

- **SSL/TLS Termination**: Nginx handles all SSL/TLS connections, decrypting incoming requests and encrypting outgoing responses
- **HTTP to HTTPS Redirection**: Automatic redirection of all HTTP traffic to HTTPS
- **Modern TLS Protocols**: Support for TLS 1.2 and 1.3 only, with older versions disabled
- **Strong Cipher Suites**: Using only high-security cipher suites with Perfect Forward Secrecy
- **HSTS Implementation**: HTTP Strict Transport Security headers to prevent downgrade attacks

### Implementation Details

The SSL/TLS configuration is implemented in the `nginx.conf` file:

```nginx
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# HSTS (31536000 seconds = 1 year)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# SSL certificate configuration
ssl_certificate /etc/nginx/ssl/nginx.crt;
ssl_certificate_key /etc/nginx/ssl/nginx.key;
```

### Certificate Management

For local development, self-signed certificates are generated automatically during the Docker build process:

```Dockerfile
# Install openssl for generating self-signed certificates
RUN apk add --no-cache openssl

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

For production environments, valid SSL certificates from trusted Certificate Authorities should be used.

## 🛡️ DDoS Protection & API Rate Limiting

The application implements a comprehensive multi-layered approach to protect against DDoS attacks and control API usage with rate limiting at both the Nginx and application levels.

### Nginx Rate Limiting

The Nginx configuration includes specialized rate limiting zones for different types of requests:

```nginx
# Define rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=posts:10m rate=15r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=20r/s;

# Apply rate limiting to specific locations
location /api/auth {
    limit_req zone=login burst=5 nodelay;
    proxy_pass http://backend;
}

location /api/posts {
    limit_req zone=posts burst=30 nodelay;
    proxy_pass http://backend;
}

location /api/upload {
    limit_req zone=upload burst=3 nodelay;
    proxy_pass http://backend;
}
```

### Express.js Backend Rate Limiting

The backend implements additional rate limiting using the `express-rate-limit` and `express-slow-down` packages:

```typescript
// Rate limiting middleware (rateLimitMiddleware.ts)
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Authentication-specific rate limiting
export const authRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: {
        error: 'Too many login attempts, please try again later.',
        retryAfter: '60 minutes'
    }
});
```

### DDoS Protection Features

Additional DDoS protection is implemented in the `ddosProtectionMiddleware.ts` file:

```typescript
// Speed limiter for gradual slowdown (ddosProtectionMiddleware.ts)
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minute window
    delayAfter: 50, // Allow 50 requests per window without delay
    delayMs: () => 500, // Add 500ms delay per request after limit
    maxDelayMs: 20000, // Max 20 seconds delay
});

// Blacklist of suspicious user agents
const suspiciousUserAgents = [
    /^.*(curl|wget|Wget|Indy Library|Baiduspider|PhantomJS|YandexBot).*$/i
];

// Middleware to check user agents and request patterns
export const ddosProtectionMiddleware = (req, res, next) => {
    // Check for suspicious user agents
    const userAgent = req.headers['user-agent'] || '';
    if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
};
```

### Connection Limiting

Nginx also implements connection limiting to prevent excessive connections from a single IP:

```nginx
# Connection limiting
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
limit_conn conn_limit_per_ip 20;
```

## 🔄 GitHub Actions Security Pipelines

The project implements multiple GitHub Actions workflows to automate security testing, scanning, and monitoring processes.

### Workflow Structure

```
.github/workflows/
├── ci-cd.yml           # Main CI/CD pipeline
├── codeql.yml          # Code quality and security analysis
├── dependency-scan.yml # Dependency vulnerability scanning
├── docker-security.yml # Docker image security scanning
└── monitoring.yml      # Security monitoring and alerts
```

### CodeQL Analysis

The CodeQL workflow performs static code analysis to identify security vulnerabilities:

```yaml
name: "CodeQL Security Analysis"

on:
  push:
    branches: [ "main", "Feature/Udeesha" ]
  pull_request:
    branches: [ "main" ]
  schedule:
    - cron: '0 2 * * 1'  # Run every Monday at 2 AM

jobs:
  analyze:
    name: Analyze Code
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
      
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: javascript, typescript
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
```

### Docker Security Scanning

The docker-security workflow uses Trivy to scan Docker images for vulnerabilities:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'blog-app-backend:${{ github.sha }}'
    format: 'table'
    severity: 'CRITICAL,HIGH'
    
- name: Upload Trivy scan results to GitHub Security tab
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

### Dependency Scanning

The dependency-scan workflow checks for vulnerabilities in project dependencies:

```yaml
- name: Backend NPM Audit
  run: |
    cd backend
    npm audit --json > ../backend-audit.json || true
    
- name: Frontend NPM Audit
  run: |
    cd frontend
    npm audit --json > ../frontend-audit.json || true
```

### Scheduled Security Checks

The monitoring workflow performs scheduled security checks:

```yaml
name: "Security Monitoring & Alerts"

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:

jobs:
  security-monitoring:
    name: Daily Security Check
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Check for security advisories
      # Implementation details
```

## 🔑 Secrets Management

The project implements best practices for secrets management to prevent hardcoded secrets in the repository.

### Key Features

- **Environment Variables**: Using `.env` files (excluded from version control)
- **GitHub Secrets**: Storing sensitive data in GitHub Actions secrets
- **Azure KeyVault Integration**: For production deployments with Terraform
- **Separate Configuration**: Development vs production secrets management

### Implementation Details

#### Local Development

The application uses `.env` files for local development, which are git-ignored:

```
# .gitignore
.env
node_modules/
backend/uploads/
.vscode/
dist/

package-lock.json
backend/logs/
```

A sample `.env.example` file is provided with placeholder values:

```
# .env.example
# PORT to run backend on
PORT=5000
# Connection URL to PostgreSQL database
DATABASE_URL=postgresql://username:password@host:port/database
# Secret key to sign tokens (random string)
TOKEN_SECRET=YOUR_TOKEN_STRING
# Cloudinary configuration
CLOUDINARY_API_KEY=API_KEY
CLOUDINARY_API_SECRET=API_SECRET
CLOUDINARY_CLOUD_NAME=CLOUD_NAME
```

#### CI/CD Environment

Secrets are stored in GitHub repository secrets and referenced in workflows:

```yaml
# Example GitHub Actions secret usage
- name: Build and push Docker image
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    TOKEN_SECRET: ${{ secrets.TOKEN_SECRET }}
  run: |
    docker build --build-arg DATABASE_URL=${DATABASE_URL} .
```

#### Production Deployment

For Azure deployments, the application uses Terraform variables with sensitive flag:

```hcl
# Terraform secure variable handling
variable "database_url" {
  description = "PostgreSQL database connection string"
  type        = string
  sensitive   = true
}

# Usage in App Service configuration
resource "azurerm_linux_web_app" "backend_app" {
  # ...
  app_settings = {
    "DATABASE_URL" = var.database_url
    "TOKEN_SECRET" = var.token_secret
  }
}
```

### Best Practices Implemented

1. **No hardcoded secrets** in repository
2. **Rotation policies** for access tokens and keys
3. **Least privilege** principle for service accounts
4. **Encrypted storage** for sensitive values
5. **Separate environments** for development, staging, and production

---

This documentation provides a comprehensive overview of the security implementations in the Blog Application. For more detailed information, please refer to the specific configuration files and code in the repository.