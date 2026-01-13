# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (with retry logic)
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production Stage
FROM node:20-slim AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies (Offline transfer from builder)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/seeders ./src/seeders 

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]
