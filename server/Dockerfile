FROM node:24-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends chromium ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY package*.json ./
COPY vendor vendor
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --ignore-scripts
COPY client client
COPY scripts scripts
RUN npm run build --workspace client

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libreoffice chromium fonts-liberation ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=5000 PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium LIBREOFFICE_PATH=/usr/bin/soffice
COPY package*.json ./
COPY vendor vendor
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --omit=dev --ignore-scripts
COPY server server
COPY --from=build /app/client/dist client/dist
RUN mkdir -p server/uploads/blog-images && chown -R node:node /app
USER node
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
