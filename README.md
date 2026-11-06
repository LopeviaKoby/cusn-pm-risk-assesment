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

La API requiere `DATABASE_URL`, `JWT_SIGNING_KEY` de al menos 32 bytes y las variables documentadas en [`deploy/env.example`](deploy/env.example). Vite conserva `index.html` en la raíz; su entrada es `/app/src/main.tsx`, el alias `@` resuelve a `app/src`, y `/api` se proxifica a `http://127.0.0.1:3001` salvo `API_PROXY_TARGET`. Solo las variables con prefijo `VITE_` pueden entrar al bundle; no coloques secretos allí. El frontend muestra Login si no hay sesión, y muestra un error con opción de reintento si una consulta REST falla. No contiene datos de negocio de respaldo.

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

`test:db` ejecuta la suite v2.1 sobre una base local nueva y desechable; los handlers, importadores y smoke incompatibles v2.0 fueron retirados. En una base desechable `pmo_test_*`, `db:models:check` compara `app/api/src/models.ts` con los metadatos reales después de `db:migrate`; `db:models` regenera ese archivo. Los contratos REST en `app/src/data/projects.ts` y `workspaces.ts` son proyecciones de transporte y no reemplazan las entidades derivadas del esquema.

`NODE_ENV=test TEST_DATABASE_URL=postgres://.../pmo_test_v210_nueva TEST_API_DATABASE_URL=postgres://runtime:.../pmo_test_v210_nueva pnpm run test:db:v210` ejecuta el baseline, su segunda aplicación, bootstrap Head y pruebas de auth/gobierno sobre una base local nueva. La suite rechaza una base que ya contenga `pmo_cusn` y no elimina bases. Genera sus contraseñas aleatorias en memoria. T01–T20 ampliados, matriz de acceso, DTO/OpenAPI, Drizzle, auth y TCP pasaron en la revisión backend. Los comandos, contratos y límites operativos se documentan en DEPLOY.md.

`pnpm run build:api` deja el bundle de Bun en `build/api/`, fuera de `dist/` y del contexto Docker del frontend.

## Alcance funcional actual

La sesión y el onboarding usan `/workspace` y `/workspace/:id`. El ID se resuelve contra el listado autorizado y no se persiste otra selección en almacenamiento local. Las cookies siguen siendo HttpOnly, el cliente usa `same-origin` y Vite mantiene `changeOrigin:false` para la validación de Origin del servidor.

| Ruta/archivo anterior | Dependencia retirada | Sustitución / resultado |
| --- | --- | --- |
| App / ApiDataGate / Shell | DataProvider, GET `/api/v1/datos`, Bootstrap | AccessGate → WorkspaceEntry → WorkspaceArea; no bootstrap legacy |
| `/proyectos`, Projects | DTO de proyectos con métricas y edición de metadatos antiguos | `/workspace/:workspaceId/proyectos`, listado REST paginado y filtrado por workspace |
| ManualForms | Mensaje que afirmaba ausencia de alta | `/workspace/:workspaceId/proyectos/nuevo`, composición de alta con bloqueo explícito de catálogos |
| Project / SuggestionReview | DTO antiguo, sugerencias y revisión IA | `/workspace/:workspaceId/proyectos/:id/resumen`, detalle REST y dashboard 360° |
| `/legacy/workspace`, riesgos, portafolio, finanzas, complejidad, aprobaciones, compras anteriores | Consultas y formularios de endpoints retirados | Estado controlado de indisponibilidad con regreso a workspaces; sin requests antiguos |

El alta envía exclusivamente `{workspaceId,tvt,nombre,clienteId,paisId,lobId,pmTitularId?}`. Los IDs/versiones se mantienen como strings. El listado devuelve un array por página: usa `after` con el último ID recibido y `limit=50`; una página completa permite solicitar la siguiente. Se filtra el workspace después de recibir cada página, sin presentar el subconjunto como total de portafolio. El detalle vuelve a comprobar que el workspace del proyecto coincide con la URL.

| Campo | Regla del contrato / negocio | Fuente operativa |
| --- | --- | --- |
| workspaceId | Obligatorio, ID estable | Workspace autorizado seleccionado |
| tvt | Obligatorio, trim, 1–80; unicidad global en servidor | Entrada de usuario |
| nombre | Obligatorio, trim, 1–200 | Entrada de usuario |
| clienteId, paisId, lobId | Obligatorios, IDs positivos string | Catálogos públicos ausentes: selects y submit bloqueados |
| pmTitularId | Opcional en HTTP; requerido para ADMIN; PM autoasignado si es elegible | Catálogo de titulares elegibles ausente; no se inventan IDs |
| Clasificación, fechas, línea base, descripción, TCV, moneda, presupuesto, documentos | Diferidos, fuera del POST estricto | Información no editable; sin persistencia simulada |

`ProjectCreateForm` acepta catálogos tipados como punto de composición futuro; la aplicación entrega `null` porque el router v2.1.0 no publica esos catálogos. Solo las pruebas usan opciones sintéticas. El permiso `proyectos.crear` y el rol efectivo condicionan el acceso al formulario; la membresía/habilitación contextual y la elegibilidad final corresponden al servidor. Un POST no se reintenta automáticamente ante pérdida de red.

| Sección 360° | Dato real disponible | Brecha / presentación actual |
| --- | --- | --- |
| Identificación | id, tvt, nombre, workspaceId, version, estado | Cliente, PM, clasificación y fechas: — |
| Avance real/plan, SPI, desviación, riesgos, actualización | Ningún campo en detalle v2.1.0 | Sin datos disponibles; sin cálculos locales |
| Curva S y último seguimiento | Sin series ni registro semanal público | Estados vacíos sin curvas, puntos ni actividades ficticias |
| Finanzas | Sin proyección financiera ni períodos | TCV/exigible/facturado/cumplimiento y matriz Showprice/Planificado/Real sin importes |
| Alertas y pendientes | Sin endpoint de riesgos, compromisos o vigencia | Indisponibilidad específica, sin semáforo calculado |
| Eventos | Sin timeline de cambios/aprobaciones/actualizaciones | Estado vacío separado del seguimiento |

Las ocho secciones del proyecto conservan URLs: Resumen, Seguimiento, Finanzas, Riesgos, Cambios, Compras, Documentos e Historial. Solo Resumen tiene composición ejecutiva; las otras comunican ausencia de contrato sin acciones falsas. No hay dashboard consolidado de portafolio. Las funciones de presentación de negocio históricas quedan sin imports desde el grafo productivo; no se modifican fórmulas financieras. Los 16 átomos conservan sus contratos.

Las comprobaciones focalizadas están en `tests/projects.test.tsx`, `tests/frontend-boundary.test.ts` y `tests/e2e/projects.spec.ts`. La prueba estática recorre fuentes y el grafo de imports del entrypoint; las de navegador usan fixtures explícitos, rechazan endpoints imprevistos y verifican Light/Dark, reflow 100/200 % y movimiento reducido. Las capturas actuales y `references/legacy/` siguen siendo material local ignorado en Git.

El diseño visual y Atomic Design se documentan en [`app/src/design-system/DESIGN.md`](app/src/design-system/DESIGN.md) y [`AGENTS.md`](AGENTS.md). `specs/migracion-apps-script-a-bun.md` conserva decisiones históricas previas a esta estructura; esta página y el código vigente describen el estado ejecutable.

Storybook es un laboratorio local sin API ni datos reales. El canvas importa `app/src/design-system/app.css` y conmuta las clases reales `.light`/`.dark`; conserva las cuatro foundations y presenta exclusivamente 16 átomos. `app/src/stories/atoms/Catalog.stories.tsx` documenta Button, IconButton, TextInput, Checkbox, RadioButton, Switch, Badge, Avatar, TextLink, BreadcrumbItem, TabItem, Spinner, Skeleton, Tooltip, Icon y Divider. `Button` y `Badge` conservan su implementación canónica en `primitives.tsx`; los demás viven en `catalog.tsx`. `tests/atoms-catalog.test.tsx` cubre los contratos funcionales y `scripts/verify-atoms-browser.mjs` comprueba el build servido en Chrome. Las fuentes WOFF2 se regeneran desde los TTF con `py -3 scripts/convert-fonts.py` (FontTools 4.60.1 y Brotli 1.1.0); los OFL permanecen junto a los originales.

## Foundry (solo `dev-tvt-foundry`)

`pnpm run check:adoption` usa los verificadores originales cuando el payload interno está presente. No descarga Foundry ni certifica la aplicación. El árbol oficial, la configuración de OpenCode y sus roles permanecen fuera del repositorio y del contexto Docker; la CI pública no depende de ellos.

<!-- tivit-foundry-signature: $2a$12$WX6l8g9An0Tz8UxbqqxV/eEorqzHariOJmGexnJnxM2RA4WtJnYfK -->
