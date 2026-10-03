FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

WORKDIR /app

FROM base AS pruner
ARG APP
COPY . .
RUN pnpm dlx turbo prune ${APP} --docker

FROM base AS builder 
ARG APP
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full .

RUN pnpm --filter @repo/db exec prisma generate
RUN pnpm turbo run build --filter=${APP}

FROM base AS runner
ARG APP
ENV NODE_ENV=production APP=${APP}
COPY --from=builder /app .

CMD [ "sh", "-c", "pnpm --filter $APP start" ]
