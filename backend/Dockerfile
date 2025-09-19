# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.16.0
FROM node:${NODE_VERSION}-slim AS base

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

# Set security headers and configurations
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Throw-away build stage to reduce size of final image
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
COPY --link package-lock.json package.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --audit-level=high && \
    npm cache clean --force

# Copy Prisma schema and generate client
COPY --link prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY --link tsconfig.json ./
COPY --link src ./src/
RUN npm run build

# Install only production dependencies for final image
RUN npm ci --only=production --audit-level=high && \
    npm cache clean --force

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

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist /app/dist
COPY --from=build --chown=nodejs:nodejs /app/package.json /app/package.json
COPY --from=build --chown=nodejs:nodejs /app/prisma /app/prisma

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
