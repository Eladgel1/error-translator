# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies based on lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY . .

# Build-time API base URL for the frontend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the production-ready static files
RUN npm run build

# Runtime stage - serve with nginx
FROM nginx:alpine AS runtime

# Remove default nginx config and add our own
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

# Optional healthcheck for the nginx container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost/health || exit 1

# Default nginx start command
CMD ["nginx", "-g", "daemon off;"]