# Local demonstration only. Keep the approved Node/pnpm versions and registry policy.
FROM ghcr.io/pnpm/pnpm:12.12.1@sha256:150c9372f3a6d02039f11dc7d1f6070896567038968c97bbb224e3b03ee3cbcc AS package-manager

FROM node:22.23.4-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS build
COPY --from=package-manager /opt/pnpm /opt/pnpm
RUN ln -s /opt/pnpm/pnpm /usr/local/bin/pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN node --version && pnpm --version && pnpm install --frozen-lockfile
COPY index.html tsconfig.json tsconfig.tests.json vite.config.ts vitest.config.ts playwright.config.ts ./
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY tests/ ./tests/
RUN pnpm run validate:demo && pnpm run test:coverage && pnpm run typecheck && pnpm run build

FROM nginxinc/nginx-unprivileged:1.30.6-alpine3.24@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime
USER root
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=101:101 /app/dist/ /usr/share/nginx/html/
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
