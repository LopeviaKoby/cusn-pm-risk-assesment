# PMO TIVIT

Aplicación web para portafolio, proyectos, riesgos y procesos PMO. Este repositorio es un monolito modular: el frontend React/Vite vive en `app/src/` y la única API Bun/Hono en `app/api/`. El navegador usa `app/src/data/client.ts` para todas las peticiones REST de mismo origen; PostgreSQL 18.6 conserva el esquema `pmo_cusn` definido por `app/api/migrations/manifest.json` y las migraciones 005–010. Las migraciones históricas 001 y 004 no se ejecutan por el migrador actual.

## Herramientas y arranque

Usa Node.js 22.23.4, pnpm 12.12.1 y Bun 1.4.4. Las versiones de dependencias están fijadas en `package.json` y `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm run dev:api
pnpm run dev
```

La API requiere `DATABASE_URL`, `GPL_PASSWORD_HASH_B64` y las variables documentadas en [`deploy/env.example`](deploy/env.example). Vite conserva `index.html` en la raíz; su entrada es `/app/src/main.tsx`, el alias `@` resuelve a `app/src`, y `/api` se proxifica a `http://127.0.0.1:3001` salvo `API_PROXY_TARGET`. Solo las variables con prefijo `VITE_` pueden entrar al bundle; no coloques secretos allí. El frontend muestra Login si no hay sesión, y muestra un error con opción de reintento si el bootstrap REST falla. No contiene datos de negocio de respaldo.

Para contenedores, configura un `.env` local a partir de `deploy/env.example` y consulta [`DEPLOY.md`](DEPLOY.md). `compose.yaml` levanta una base, aplica migraciones, configura el rol de aplicación, verifica el esquema y arranca API y web. El Dockerfile de la API usa el manifiesto y lockfile raíz para instalar dependencias de producción con `pnpm install --prod --frozen-lockfile`, y luego ejecuta Bun. Ningún archivo de entorno debe entrar a Git o a la imagen.

## Comprobaciones

```sh
pnpm run typecheck
pnpm run typecheck:api
pnpm run test
pnpm run test:domain
pnpm run build
pnpm run test:e2e
pnpm run storybook
pnpm run build-storybook
```

`test:db` instala y comprueba las seis migraciones activas en una base desechable nueva. Exige `NODE_ENV=test` y `TEST_DATABASE_URL` apuntando a `pmo_test` o `pmo_test_*`; nunca se ejecuta contra la base compartida. Tras migrar esa base, `db:models:check` compara `app/api/src/models.ts` con los metadatos reales. `db:models` regenera ese archivo desde la misma base aislada. Los DTO REST en `app/src/data/contracts.ts` son proyecciones de transporte y no reemplazan las entidades derivadas del esquema.

`pnpm run build:api` deja el bundle de Bun en `build/api/`, fuera de `dist/` y del contexto Docker del frontend.

## Alcance funcional actual

- Proyectos, riesgos, facturación y portafolio leen datos de la API. Ediciones de proyecto y riesgo usan los recursos existentes y reconsultan el bootstrap después de guardar; los errores del servidor se muestran sin aplicar cambios locales aparentes.
- Complejidad, aprobaciones y compras permanecen en `app/src/pages/` con las rutas REST existentes. Las consultas y escrituras siguen sujetas a la autorización del servidor.
- La API todavía no ofrece alta general de proyecto o de riesgo de proyecto, ni persistencia de sugerencias. La interfaz indica que esas capacidades no están disponibles. No se infiere una política de roles de sus nombres; la matriz de permisos y auth se revisarán por separado.
- `NULL` en evaluación de riesgos o importes significa ausencia de registro y se presenta como “Sin dato” o “Sin evaluación”; cero se conserva como importe registrado. El tipo amenaza/oportunidad tampoco se infiere cuando el esquema no lo aporta.

El diseño visual y Atomic Design se documentan en [`app/src/design-system/DESIGN.md`](app/src/design-system/DESIGN.md) y [`AGENTS.md`](AGENTS.md). `specs/migracion-apps-script-a-bun.md` conserva decisiones históricas previas a esta estructura; esta página y el código vigente describen el estado ejecutable.

Storybook es un laboratorio local sin API ni datos reales. El canvas importa `app/src/design-system/app.css` y conmuta las clases reales `.light`/`.dark`; conserva las cuatro foundations y presenta exclusivamente 16 átomos. `app/src/stories/atoms/Catalog.stories.tsx` documenta Button, IconButton, TextInput, Checkbox, RadioButton, Switch, Badge, Avatar, TextLink, BreadcrumbItem, TabItem, Spinner, Skeleton, Tooltip, Icon y Divider. `Button` y `Badge` conservan su implementación canónica en `primitives.tsx`; los demás viven en `catalog.tsx`. `tests/atoms-catalog.test.tsx` cubre los contratos funcionales y `scripts/verify-atoms-browser.mjs` comprueba el build servido en Chrome. Las fuentes WOFF2 se regeneran desde los TTF con `py -3 scripts/convert-fonts.py` (FontTools 4.60.1 y Brotli 1.1.0); los OFL permanecen junto a los originales.
