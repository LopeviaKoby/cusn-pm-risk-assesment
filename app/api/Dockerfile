# Instalación reproducible desde el lockfile pnpm raíz.
FROM ghcr.io/pnpm/pnpm:12.12.1@sha256:150c9372f3a6d02039f11dc7d1f6070896567038968c97bbb224e3b03ee3cbcc AS package-manager
FROM node:22.23.4-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS deps
COPY --from=package-manager /opt/pnpm /opt/pnpm
RUN ln -s /opt/pnpm/pnpm /usr/local/bin/pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a

WORKDIR /app
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=3001

COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun package.json pnpm-lock.yaml ./
COPY --chown=bun:bun app/api/ ./app/api/

USER bun
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=12 \
  CMD bun -e "fetch('http://127.0.0.1:3001/api/v1/listo').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "app/api/src/index.ts"]
