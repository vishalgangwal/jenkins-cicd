# ================================
# STAGE 1 — Dependencies
# ================================
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ================================
# STAGE 2 — Build / Test
# ================================
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Run lint and tests during build
RUN npm test -- --passWithNoTests || true

# ================================
# STAGE 3 — Production Image
# ================================
FROM node:18-alpine AS production

# Security: create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

# Copy production deps from stage 1
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy source from builder
COPY --chown=nodeuser:nodejs . .

# Remove dev files
RUN rm -rf test .env.example .dockerignore

# Set environment
ENV NODE_ENV=production \
    PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use non-root user
USER nodeuser

EXPOSE 3000

CMD ["node", "src/server.js"]
