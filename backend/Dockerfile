FROM node:18-slim

WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

# Install dependencies (fast & deterministic)
RUN npm ci --loglevel=error

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
