# Stage 1: Build library and playground
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Run unit tests
RUN npm test

# Build package and playground portal
RUN npm run build
RUN npm run build:playground

# Stage 2: Serve production web portal with Nginx
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Clean default nginx assets
RUN rm -rf ./*

# Copy built static site from builder stage
COPY --from=builder /app/playground/dist ./

# Configure Nginx SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
