# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Install dependencies
# Separated so Docker can cache node_modules when only source changes.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# ci is stricter than install: uses lock-file exactly, fails on mismatch
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Build
# SPRING_API_URL is the internal Docker network address of the backend.
# It is evaluated by next.config.ts at build time (rewrites destination).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG SPRING_API_URL=http://backend:8080
ENV SPRING_API_URL=${SPRING_API_URL}

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Runtime
# next.config output:"standalone" produces .next/standalone/server.js
# which bundles everything needed — no node_modules install required.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Copy standalone server + static assets + public folder
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
