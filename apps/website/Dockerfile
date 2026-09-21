# syntax=docker/dockerfile:1.7

FROM node:24.18.0-bookworm-slim AS build
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/explorer/package.json apps/explorer/
COPY apps/website/package.json apps/website/
COPY packages/public-collection packages/public-collection
COPY packages/object-dossier packages/object-dossier
COPY schemas/object-dossier-packet.schema.json schemas/

# Skip Git hooks; still run approved dependency build scripts.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
 && pnpm rebuild esbuild

COPY apps/website apps/website
RUN pnpm --filter @mosa/website build

FROM nginx:1.28-alpine AS runtime
COPY apps/website/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/apps/website/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
