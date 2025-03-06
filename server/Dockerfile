# Use a smaller Node.js base image for efficiency
FROM node:18-slim

# Install required system packages, including LibreOffice
RUN apt-get update && \
    apt-get install -y libreoffice && \
    rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV LIBREOFFICE_PATH="/usr/bin/libreoffice"

# Set working directory
WORKDIR /app

# Copy dependency manifests first for efficient caching
COPY package*.json ./

# Install dependencies efficiently
RUN npm ci --only=production

# Copy application source code
COPY . .

# Ensure required directories exist with proper permissions
RUN mkdir -p /app/uploads /app/logs /app/temp && \
    chown -R node:node /app

# Switch to a non-root user for security
USER node

# Expose the port for Render (not strictly needed, but good practice)
EXPOSE 10000

# Start the server using npm start, as Render expects this
CMD ["npm", "start"]
