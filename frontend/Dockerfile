# Development Dockerfile for Frontend
FROM node:18-alpine

# Set environment variables to reduce npm output and fix Docker file watching
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=1000

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --silent

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

# Start development server with proper host binding
CMD ["npm", "run", "dev"]