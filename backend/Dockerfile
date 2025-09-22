# syntax=docker/dockerfile:1

# Build stage
FROM node:18-slim AS build
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/
COPY prisma ./prisma/
RUN npx prisma generate
RUN npx tsc

# Final image
FROM node:18-slim
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --only=production

# Copy build output + prisma client
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
