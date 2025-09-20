# syntax = docker/dockerfile:1

# Use Node.js 18 LTS slim
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start backend
CMD ["npm", "start"]
