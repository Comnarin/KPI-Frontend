# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Set build-time env for API (if needed, otherwise handled by env file or client config)
# ENV NEXT_PUBLIC_API_URL=http://localhost:4000/api
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone build generates a bundle that only needs node_modules/next
# and doesn't require the full source or devDependencies.
# To use standalone, we need to ensure next.config.ts has `output: 'standalone'`
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
