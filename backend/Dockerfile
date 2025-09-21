FROM node:18-slim AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
# Add Prisma skip flag
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
# Add npm config for better network handling
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retry-maxtimeout 60000 \
    && npm ci --loglevel=error

FROM node:18-slim
WORKDIR /app

# Install OpenSSL and curl for Prisma and health checks
RUN apt-get update -y && apt-get install -y openssl curl

COPY --from=builder /app/node_modules /app/node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "run", "server"]