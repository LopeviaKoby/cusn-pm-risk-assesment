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
| clienteId, paisId, lobId | Obligatorios, IDs positivos string | GET /api/v1/clientes, /paises y /lobs; IDs persistentes, nunca ISO (integración del consumidor publicada en otra entrega) |
| pmTitularId | Opcional en HTTP; requerido para ADMIN; PM autoasignado si es elegible | GET /api/v1/workspaces/:id/elegibles?para=PM_TITULAR; sin usuarios inventados |
| Clasificación, fechas, línea base, descripción, TCV, moneda, presupuesto, documentos | Diferidos, fuera del POST estricto | Información no editable; sin persistencia simulada |

`ProjectCreateForm` es la única composición de alta. `useProjectCatalogs` consulta los contratos registrados en el router y OpenAPI locales mediante `api()` y cookies de mismo origen. Cliente y PM buscan en servidor (`q`, debounce y cancelación); País y LOB filtran los registros recibidos. El backend ahora pagina clientes con cursor y entrega países/LOB completos; el consumidor publicado del catálogo agregado debe adaptarse en una entrega frontend independiente. Elegibles conserva su límite G1 actual. La búsqueda remota sigue las coincidencias del servidor; el filtro local ignora case, acentos y espacios para presentación. Cada campo tiene disponibilidad independiente; errores no son catálogos vacíos. Un 404 del entorno muestra indisponibilidad y reintento sin opciones falsas.

`SearchableSelect` compone botones e input nativos, sin API ni semántica ARIA de combobox incompleta. `CreateClientDialog` usa Radix Dialog y solicita solo nombre; conserva el proyecto, valida identidad string de respuesta, deduplica por ID y selecciona tras éxito persistente. La publicación frontend previa **no habilita Agregar registro**. El backend ahora ofrece POST /api/v1/clientes y el permiso independiente clientes.crear, propuesto por el propietario para desarrollo y pendiente de ratificación para producción; conectar el diálogo queda para otra entrega. Los callbacks sintéticos viven solo en tests/Storybook; guardar sin servicio muestra un error contextual sin simular persistencia. `proyectos.crear` no concede alta de clientes. LOB, País y PM no tienen alta inline. La autorización final corresponde al servidor. No se reintenta automáticamente un POST incierto.

| Necesidad backend | Contrato local comprobado / pendiente | Respuesta y condiciones |
| --- | --- | --- |
| Clientes activos | GET /api/v1/clientes?q=…&limit=…&after=… | {data:{items:[{id,nombre,sector}],paginacion:{limit,total,hasMore,nextCursor}}}; ADMIN/PM internos; búsqueda literal y cursor por ID numérico; 401/403/422/5xx. |
| Países activos | GET /api/v1/paises | {data:[{id,codigo,nombre}]}; todos los activos, lectura interna G1; sin CRUD. |
| LOB activas | GET /api/v1/lobs | {data:[{id,nombre}]}; todas las activas, lectura interna G1; sin CRUD. |
| PM elegibles por workspace | Existente: `GET /api/v1/workspaces/:id/elegibles?para=PM_TITULAR&limit=100&q=…` | `{data:{items:[{usuarioId,nombre,email,tipoUsuario,rol,miembroActivo,puedeCrearProyectos}]}}`; autorización contextual Head/PM. Solo candidatos internos PM con membresía activa; sin invitar. Sin cursor: se informa parcial al alcanzar límite. |
| Alta de cliente | POST /api/v1/clientes, permiso clientes.crear | {nombre} con trim, 1–200; 201 {data:{id,nombre,sector:null}}. ADMIN/PM internos activos con permiso propio. Repetir nombre crea otra identidad; sin rechazo/fusión por nombre. Política propuesta para desarrollo; producción requiere ratificación explícita. |

El recurso agregado anterior y sus derivados responden 404 y no figuran en OpenAPI. La matriz backend completa y los errores están en DEPLOY.md. No se modificaron app/src ni los callbacks del frontend en este corte.

### Gráficos de presentación

Recharts **3.10.1** (MIT, peer React 19) se carga de forma diferida por `ProgressChart`/`progress-plot`. `react-is` es una dependencia directa **19.3.0**, igual que React, según el [README oficial de Recharts 3.10.1](https://github.com/recharts/recharts/blob/v3.10.1/README.md). No hay override de react-is en package.json ni pnpm-workspace.yaml: Recharts 3 consume el peer explícito; otras herramientas conservan sus dependencias compatibles. Se mantienen los overrides de seguridad ajenos a esta biblioteca.

Las líneas usan `--chart-planned`/`--chart-real`, texto/superficies/bordes canónicos y Manrope; planificado discontinuo y real continuo, tabla alternativa y huecos `null` sin conectar. No hay animación ni cálculos de dominio. El resumen utiliza el componente sin series y conserva su estado vacío; Recharts no se descarga hasta que existan puntos. Storybook tiene series sintéticas claramente identificadas, excluidas del producto.

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

Storybook es un laboratorio local sin API ni datos reales. El canvas importa `app/src/design-system/app.css` y conmuta las clases reales `.light`/`.dark`; conserva las cuatro foundations y los 16 átomos, y añade composiciones sintéticas en Fixtures para catálogos/modal y gráficos. `app/src/stories/atoms/Catalog.stories.tsx` documenta Button, IconButton, TextInput, Checkbox, RadioButton, Switch, Badge, Avatar, TextLink, BreadcrumbItem, TabItem, Spinner, Skeleton, Tooltip, Icon y Divider. `Button` y `Badge` conservan su implementación canónica en `primitives.tsx`; los demás viven en `catalog.tsx`. `tests/atoms-catalog.test.tsx` cubre los contratos funcionales y `scripts/verify-atoms-browser.mjs` comprueba el build servido en Chrome. Las fuentes WOFF2 se regeneran desde los TTF con `py -3 scripts/convert-fonts.py` (FontTools 4.60.1 y Brotli 1.1.0); los OFL permanecen junto a los originales.
