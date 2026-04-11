FROM node:20-alpine AS base

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE_BUILD=1

# ── ONLY truly-public vars are baked in at build time ──
# Next.js will automatically pick these up from copies .env.production
# (We don't declare them as ARG/ENV here because gcloud run deploy doesn't pass build-args natively, and making them empty ENVs overrides local .env files)

# ── Secrets are NOT baked in — they come from Cloud Run env vars at runtime ──
# SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, GEMINI_API_KEY are runtime-only

RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
