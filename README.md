# PMO TIVIT

Aplicación web para portafolio, proyectos, riesgos y procesos PMO. Este repositorio es un monolito modular: el frontend React/Vite vive en `app/src/` y la única API Bun/Hono en `app/api/`. El navegador usa `app/src/data/client.ts` para todas las peticiones REST de mismo origen. El manifiesto de migraciones activa el baseline 011 de v2.1.0 sobre una base de desarrollo vacía; las migraciones 001–010 quedan documentadas como historia, sin ejecutarse sobre ese baseline.

El backend v2.1.0 integra autenticación propia y gobierno F1–F7: workspaces, invitaciones/membresía, roles, proyectos/portafolio, transferencia y suplencias con autorización por objeto. La aceptación usa PostgreSQL 18.6 aislado, rol runtime limitado y un proceso Bun atendiendo TCP. Los dominios aplazados no tienen endpoints activos; las pantallas anteriores requieren una etapa independiente. No se aplicó el baseline a una base compartida.

## Herramientas y arranque

Usa Node.js 22.23.4, pnpm 12.12.1 y Bun 1.4.4. Las versiones de dependencias están fijadas en `package.json` y `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm run dev:api
pnpm run dev
```

La API requiere `DATABASE_URL`, `JWT_SIGNING_KEY` de al menos 32 bytes y las variables documentadas en [`deploy/env.example`](deploy/env.example). Vite conserva `index.html` en la raíz; su entrada es `/app/src/main.tsx`, el alias `@` resuelve a `app/src`, y `/api` se proxifica a `http://127.0.0.1:3001` salvo `API_PROXY_TARGET`. Solo las variables con prefijo `VITE_` pueden entrar al bundle; no coloques secretos allí. El frontend muestra Login si no hay sesión, y muestra un error con opción de reintento si el bootstrap REST falla. No contiene datos de negocio de respaldo.

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

`test:db` ejecuta la suite v2.1 sobre una base local nueva y desechable; los handlers, importadores y smoke incompatibles v2.0 fueron retirados. En una base desechable `pmo_test_*`, `db:models:check` compara `app/api/src/models.ts` con los metadatos reales después de `db:migrate`; `db:models` regenera ese archivo. Los DTO REST en `app/src/data/contracts.ts` son proyecciones de transporte y no reemplazan las entidades derivadas del esquema.

`NODE_ENV=test TEST_DATABASE_URL=postgres://.../pmo_test_v210_nueva TEST_API_DATABASE_URL=postgres://runtime:.../pmo_test_v210_nueva pnpm run test:db:v210` ejecuta el baseline, su segunda aplicación, bootstrap Head y pruebas de auth/gobierno sobre una base local nueva. La suite rechaza una base que ya contenga `pmo_cusn` y no elimina bases. Genera sus contraseñas aleatorias en memoria. T01–T20 ampliados, matriz de acceso, DTO/OpenAPI, Drizzle, auth y TCP pasaron en la revisión backend. Los comandos, contratos y límites operativos se documentan en DEPLOY.md.

`pnpm run build:api` deja el bundle de Bun en `build/api/`, fuera de `dist/` y del contexto Docker del frontend.

## Alcance funcional actual

El acceso inicial usa `/workspace` para descubrir espacios y `/workspace/:id` para entrar al ID estable devuelto por PMO v2.1.0. El ID de la URL se resuelve únicamente contra el listado autorizado de la sesión; no se guarda un workspace seleccionado en almacenamiento local. Seleccionar es navegación frontend. La creación envía únicamente `{nombre}` (trim, 1–200 caracteres), vuelve a consultar el listado y entra al espacio. Al recuperar foco se revalidan sesión y permisos.

| Ruta UI | Gate/provider | Endpoint y contrato | Estado / frontera |
| --- | --- | --- | --- |
| `/login` | AccessProvider | GET/POST/DELETE `/api/v1/sesion`, cookies de mismo origen | Autenticación vigente; se conserva la pantalla TIVIT |
| `/workspace` | AccessGate → WorkspaceEntry | GET sesión + GET workspaces → `{id,nombre,slug,version}[]` | v2.1.0, sin bootstrap |
| Creación en `/workspace` | WorkspaceEntry | POST workspaces `{nombre}` → objeto workspace | v2.1.0, permiso efectivo `workspaces.crear` |
| `/workspace/:id` | WorkspaceEntry | Resuelve ID desde listado autorizado | Home mínimo, sin métricas ni proyectos inventados |
| `/legacy/workspace`, módulos anteriores | DataProvider → ApiDataGate → Shell | GET `/api/v1/datos`, DTO `Bootstrap` | Legacy; su fallo queda delimitado con enlace de regreso |

La frontera nueva no importa `bootstrap.tsx` ni `Bootstrap`. Las páginas anteriores se mantienen con sus contratos históricos; migrarlas requiere adaptadores específicos futuros. `GET /api/v1/datos` no forma parte del OpenAPI v2.1.0. El proxy Vite conserva `changeOrigin:false` y credenciales `same-origin`; el servidor continúa validando Origin y autorización. Las referencias visuales locales de `app/src/design-system/references/` permanecen ignoradas en Git.

- La API v2.1 ofrece creación, listado acotado y detalle de proyectos, edición de nombre con versión, transferencia Head y suplencias. Los DTO nuevos no sustituyen todavía el bootstrap visual anterior.
- Complejidad, aprobaciones y compras se preservan en `app/src/pages/`; sus módulos backend, junto con riesgos, facturación y cierre, quedan fuera de este corte; las rutas obsoletas fueron retiradas.
- No hay registro público ni login demo. Las cuentas se crean por bootstrap restringido o invitación controlada, con uno de los cuatro roles y comprobaciones por objeto en servidor.
- La persistencia distingue `NULL` de cero y mantiene bigint/decimal sin pérdida de precisión. Las pruebas de la proyección verifican tipos y columnas generadas; esto no declara funcionales los dominios aplazados.

El diseño visual y Atomic Design se documentan en [`app/src/design-system/DESIGN.md`](app/src/design-system/DESIGN.md) y [`AGENTS.md`](AGENTS.md). `specs/migracion-apps-script-a-bun.md` conserva decisiones históricas previas a esta estructura; esta página y el código vigente describen el estado ejecutable.

Storybook es un laboratorio local sin API ni datos reales. El canvas importa `app/src/design-system/app.css` y conmuta las clases reales `.light`/`.dark`; conserva las cuatro foundations y presenta exclusivamente 16 átomos. `app/src/stories/atoms/Catalog.stories.tsx` documenta Button, IconButton, TextInput, Checkbox, RadioButton, Switch, Badge, Avatar, TextLink, BreadcrumbItem, TabItem, Spinner, Skeleton, Tooltip, Icon y Divider. `Button` y `Badge` conservan su implementación canónica en `primitives.tsx`; los demás viven en `catalog.tsx`. `tests/atoms-catalog.test.tsx` cubre los contratos funcionales y `scripts/verify-atoms-browser.mjs` comprueba el build servido en Chrome. Las fuentes WOFF2 se regeneran desde los TTF con `py -3 scripts/convert-fonts.py` (FontTools 4.60.1 y Brotli 1.1.0); los OFL permanecen junto a los originales.
