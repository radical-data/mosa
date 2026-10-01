# syntax=docker/dockerfile:1.7

FROM node:24.18.0-bookworm-slim AS build
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
 && pnpm rebuild esbuild

COPY astro.config.mjs tsconfig.json ./
COPY src src
COPY public public
COPY scripts scripts
COPY collection collection
COPY articles articles
RUN --mount=type=cache,id=astro-assets,target=/app/node_modules/.astro/assets \
    pnpm build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --output-document=/dev/null http://127.0.0.1:8080/es/ || exit 1
