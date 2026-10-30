# API Bun del laboratorio. Imagen fijada por digest; sin secretos ni dependencias del host.
FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a

WORKDIR /app
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=3001

COPY --chown=bun:bun server/ ./server/

USER bun
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=12 \
  CMD bun -e "fetch('http://127.0.0.1:3001/api/v1/listo').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "server/src/index.ts"]