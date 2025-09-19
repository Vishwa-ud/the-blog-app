# syntax = docker/dockerfile:1

# Use Node.js 18 LTS
FROM node:18-slim AS base

LABEL fly_launch_runtime="Node.js/Prisma"
LABEL maintainer="your-email@domain.com"
LABEL description="Blog App Backend - Node.js/Express/Prisma"

# Create app user for security (non-root)
RUN groupadd --gid 1001 --system nodejs && \
    useradd --uid 1001 --system --gid nodejs --shell /bin/bash nodejs

# Node.js/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

# Build stage
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
    build-essential \
    openssl \
    pkg-config \
    python3 \
    ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy package files
COPY --link package.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install --timeout=300000 && \
    npm cache clean --force

# Copy Prisma schema and generate client
COPY --link prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY --link tsconfig.json ./
COPY --link src ./src/

# Build TypeScript
RUN npm run build

# Final stage for app image
FROM base

# Install runtime packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    openssl \
    ca-certificates \
    dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy package.json for production install
COPY --link package.json ./

# Install only production dependencies
RUN npm install --only=production --timeout=300000 && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist /app/dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules/.prisma /app/node_modules/.prisma

# Set correct ownership and permissions
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
