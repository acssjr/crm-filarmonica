# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/api/package*.json ./packages/api/

# Install dependencies
RUN npm ci --workspace=@crm-filarmonica/shared --workspace=@crm-filarmonica/api

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

# Build shared package first
RUN npm run build --workspace=@crm-filarmonica/shared

# Build API
RUN npm run build --workspace=@crm-filarmonica/api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/api/package*.json ./packages/api/

# Install production dependencies only
RUN npm ci --workspace=@crm-filarmonica/shared --workspace=@crm-filarmonica/api --omit=dev

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

# Copy migrations
COPY --from=builder /app/packages/api/drizzle ./packages/api/drizzle

EXPOSE 3000

CMD ["node", "packages/api/dist/server.js"]
