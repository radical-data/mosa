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

# Skip the root prepare hook (lefthook); still run approved dependency build scripts.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
 && pnpm rebuild esbuild

COPY apps/explorer apps/explorer

RUN pnpm --filter @mosa/explorer build \
 && pnpm --filter @mosa/explorer deploy --legacy --prod --ignore-scripts /deploy

FROM node:24.18.0-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

RUN groupadd --system --gid 999 mosa \
 && useradd --system --uid 999 --gid mosa --create-home --home-dir /home/mosa mosa

COPY --from=build --chown=mosa:mosa /deploy ./

USER mosa

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const port=process.env.PORT||'4321';const token=process.env.HEALTHCHECK_TOKEN;if(!token){process.exit(1)};fetch('http://127.0.0.1:'+port+'/readyz',{headers:{'X-Health-Token':token}}).then((r)=>process.exit(r.status===204?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server/entry.mjs"]
