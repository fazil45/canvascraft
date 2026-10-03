FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS pruner
ARG APP=exalidraw-frontend
COPY . .
RUN pnpm dlx turbo prune ${APP} --docker

FROM base AS builder
ARG APP=exalidraw-frontend
# NEXT_PUBLIC_* vars are baked in at BUILD time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=${APP}

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/${APP}/.next/standalone ./
COPY --from=builder /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder /app/apps/${APP}/public ./apps/${APP}/public
EXPOSE 3000
CMD ["node", "apps/exalidraw-frontend/server.js"]