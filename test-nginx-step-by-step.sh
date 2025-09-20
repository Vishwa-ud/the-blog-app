#!/bin/bash
# Step-by-step Docker testing script

echo "🔍 Step-by-step Docker Nginx Testing"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Cleaning up...${NC}"
docker-compose down --remove-orphans

echo -e "${BLUE}Step 2: Testing Nginx configuration syntax...${NC}"
docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t

echo -e "${BLUE}Step 3: Building services individually...${NC}"
echo "Building Nginx..."
docker-compose build nginx

echo -e "${BLUE}Step 4: Testing Nginx standalone (without dependencies)...${NC}"
# Create minimal test to see if nginx config is valid
docker run --rm \
  -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -p 8080:80 \
  --name nginx-test \
  nginx:alpine nginx -g "daemon off;" &

NGINX_PID=$!
sleep 3

echo "Testing Nginx on port 8080..."
curl -I http://localhost:8080 2>/dev/null && echo -e "${GREEN}✅ Nginx responding${NC}" || echo -e "${RED}❌ Nginx not responding${NC}"

kill $NGINX_PID 2>/dev/null || true

echo -e "${BLUE}Step 5: Starting services with proper order...${NC}"
echo "This will start services and show their logs..."