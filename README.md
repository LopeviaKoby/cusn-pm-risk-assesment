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

## Alcance funcional actual del frontend

La sesión conserva cookies HttpOnly, `credentials: same-origin` y `changeOrigin:false` en Vite. `/workspace` descubre espacios autorizados; no existe bootstrap operativo ni solicitudes a `/api/v1/datos` o `/api/v1/catalogos`. Los cambios de esta entrega se limitan al frontend y sus pruebas; `access.tsx` y `client.ts` preexistentes se preservan y sus modificaciones locales ajenas se excluyen. Los permisos del proyecto llegan desde WorkspaceArea; Portafolio consulta workspaceSession. La cabecera recibe la identidad como prop, sin depender de extensiones locales no publicadas de AccessProvider.

| Ruta UI | Datos / operaciones vigentes | Composición |
| --- | --- | --- |
| `/workspace/:id/proyectos` | `GET /workspaces/:id/proyectos`, cursor ID, 50 por página | Tabla semántica simple y sidebar de proyectos recibidos |
| `/workspace/:id/proyectos/nuevo` | Clientes paginados, países/LOB completos, elegibles del workspace; POST proyecto completo | ProjectCreateForm + ProjectPlanningFields + SearchableSelect + CreateClientDialog |
| `/workspace/:id/proyectos/:id/resumen` | Ficha ampliada; inicio versionado; PATCH selectivo | ProjectLayout, ProjectRecord, ProjectOverview; campos y fechas reales |
| `…/facturacion` | Resumen de ventana, CPI a corte, POST/PATCH de hitos MANUAL | BillingMatrix, ContextPanel, BillingLineForm; alias `…/finanzas` redirige |
| `…/documentos` | Estado y carpetas persistidas Drive | DriveTree, consulta manual y polling acotado |
| `/portafolio?tab=lista|tablero` | Portafolio paginado, filtros y orden servidor | PortfolioLayout, tabla sticky, edición inline de nombre, peek, analítica |

Todas las rutas API de la tabla tienen prefijo `/api/v1`. `app/src/data/` concentra los contratos REST y el cliente existente. Los átomos no cambian; moléculas no ejecutan persistencia. No se importan entidades SQL, Drizzle, contratos backend ni datos de negocio demo en el grafo productivo.

### Registro e inicio (Flujo 1.1)

El POST incluye workspace/TVT/nombre y los IDs string de cliente/país/LOB; PM titular solo para ADMIN. Añade `fechaInicio`, `fechaTerminoBaseline`, recepción opcional, descripción, situación inicial, especialistas elegibles y `condicionComercial`. TCV DEFINIDO exige importe decimal string y moneda; ILIMITADO envía valor null, sin convertirlo en cero. No se convierten bigint o importes a Number. No se envían controles de campos no persistibles.

Cliente usa `GET /clientes?q&limit=100&after` con búsqueda remota cancelable, reinicio del cursor y carga de páginas. País/LOB usan sus recursos separados; PM y especialistas, `GET /workspaces/:id/elegibles?para=…`. Las opciones conservan el ID real; nombres homónimos no se fusionan. La clasificación histórica null se muestra como Sin clasificación. Un error/carga no se presenta como búsqueda vacía.

El modal de cliente exige nombre (1–200, trim) y clasificación manual NUEVO/ANTIGUO. Solo se ofrece con `clientes.crear` efectivo y perfil ADMIN/PM; el permiso no deriva de proyectos.crear. La concesión de producción necesita ratificación independiente. Tras respuesta persistente, se deduplica por ID y se selecciona conservando todos los campos del proyecto. No se reintenta un POST incierto automáticamente.

La ficha muestra identidad, titular, fechas, descripción, situación y condición contractual del servidor. TCV y fechas protegidas son lectura. Editar nombre usa `version` y `accionesDisponibles.puedeEditarFicha`. Iniciar ejecución solo aparece en Requiere P1P2 con autorización contextual; envía `{version}`, vuelve a consultar fecha/estado y trata 409 sin bucles. La fecha real pertenece al servidor (America/Santiago), no al navegador.

### Facturación y Documentos

Facturación solicita una ventana mensual explícita de hasta 60 meses y corte CPI. Agregados y totales son del servidor para la ventana completa, aunque los hitos estén paginados. Se muestran Showprice, Planificado y Real reportado por unidad, sin suma mixta ni cálculo financiero local. La tabla conserva etiquetas sticky y scroll contenido. Las celdas abren detalle; se pueden cargar los siguientes hitos de la ventana. Los estados CPI null se describen sin porcentajes artificiales. Real reportado no significa cobro ni conciliación ERP.

Crear/editar hitos requiere permiso facturacion.reportar, autorización contextual y lectura financiera satisfactoria; 403 revoca la edición. Solo MANUAL es editable; no hay borrado ni edición de hitos CAMBIO. Se exige confirmación, versión y clave UUID original. El doble envío se bloquea; un resultado incierto conserva la clave y el contenido para reintento explícito idéntico. 409 conserva el editor hasta que el usuario solicite la versión vigente. Showprice de un hito no autoriza a alterar la línea base comercial global.

Documentos representa exclusivamente carpetas devueltas por `GET /proyectos/:id/drive/carpetas`. Usa parentDriveId y ruta persistidos, sin reconstruir nombres del árbol ni importar el JSON backend. Distingue NO_SOLICITADO/PENDIENTE/EN_PROCESO/COMPLETADO/ERROR; muestra cantidades observadas, no porcentajes simulados. Consulta cada 5 segundos mientras esté transitorio, hasta 12 respuestas por ciclo, y detiene al completar/fallar o desmontar. Los enlaces HTTPS de Drive se abren con noopener/noreferrer; no conceden ACL humanas. No hay upload, edición de contenido ni reprovisión inventada.

### Portafolio operativo y analítico

La URL conserva tab, filtros, orden, offset y peek. `/portafolio` usa offset/limit exclusivamente, sin mezclar after. Las cabeceras ofrecen orden solo para campos admitidos por la API; cambiar filtros/orden reinicia la página. País/LOB/cliente usan IDs de recursos reales; Squad/PM ofrecen IDs de la página, identificados como parciales. Incluir inactivos se limita a ADMIN. Chips y limpieza individual/global hacen visibles los filtros.

TVT/nombre permanecen sticky en escritorio y la tabla desplaza dentro de su región. En reflow estrecho se libera la fijación para conservar área útil. El nombre abre una ficha real lateral sin reemplazar la tabla ni perder su scroll; ampliar conserva el origen en la URL. Tras consultar la ficha, el nombre admite edición inline únicamente con permiso contextual, versión y manejo explícito de 409/403. Otras columnas permanecen lectura; transferencia y reasignación no son inputs genéricos.

Los KPI/distribución por estado usan resumenPorEstado global del servidor para el filtro vigente. El gráfico permite filtrar ambos tabs. Las distribuciones por país/LOB/PM se calculan solo sobre la página y se rotulan parciales. SPI, riesgos, compras, ahorros, lead time, series históricas y concentración financiera permanecen sin fuente; no hay N+1 financiero ni series fabricadas desde updatedAt. Recharts 3.10.1 usa tokens canónicos y tabla alternativa, sin instalar bibliotecas nuevas.

### Brechas y aceptación pendiente

| Dependencia concreta | Consecuencia / siguiente validación |
| --- | --- |
| No hay recurso HTTP para catálogo Squad | Se informa como opcional no disponible; no se envía squadId inventado. La edición de otros atributos puede ampliarse cuando haya fuente autorizada. |
| Elegibles limitado a 100, sin cursor | Se informa selección parcial si alcanza el límite; no se declara exhaustividad. |
| Drive deshabilitado por defecto y worker por invocación | Backend/operación debe habilitar solo entornos configurados y supervisar un ejecutor automático; validar proyecto → job → 84 carpetas y repetición sin duplicados. El frontend no compensa esta ausencia ni activa producción. |
| Agregados de dominios futuros ausentes | Se necesitan contratos con medida, unidad, denominador/alcance y calidad para SPI, riesgos, compras, finanzas globales e históricos. No se inventan URLs. |
| Mutabilidad de Showprice de hito MANUAL | Ratificar la política comercial: la UI distingue registro de hito de modificación contractual; no hay cambio de TCV ni de baseline global. |
| Laboratorio real no habilitado para esta entrega | Por instrucción del propietario, no se levanta PostgreSQL ni se configuran usuarios. Aceptación Bun/PostgreSQL/sesión real y automatismo Drive **NO EJECUTADOS**. |

Storybook conserva foundations/16 átomos y añade Fixtures/Operaciones PMO para tabla, menús/filtro, peek, matriz, editor, Drive y analítica. Todos sus datos están en `app/src/stories/catalogs/pmo-fixtures.ts`, fuera del grafo productivo. Los tests de navegador interceptan la API: comprueban frontend y contratos simulados, no persistencia real ni ACL de Drive. No equivalen a aprobación E2E integral ni auditoría WCAG completa.

Para reproducir las comprobaciones frontend con Node 22.23.4 / pnpm 12.12.1:

```powershell
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run build-storybook
# Terminales separadas; detener solamente estos previews al terminar:
pnpm run preview --port 4173 --strictPort
pnpm exec vite preview --outDir storybook-static --port 6008 --strictPort --host 127.0.0.1
# Terminal de pruebas (Chrome instalado):
$env:PLAYWRIGHT_CHANNEL='chrome'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'
$env:STORYBOOK_BASE_URL='http://127.0.0.1:6008'
pnpm run test:e2e
```

Las pruebas incluyen 0/1/N, cursor de clientes, PM/ADMIN, conflictos, payloads completos, idempotencia financiera, separación de monedas, polling Drive, más de 50 filas simuladas, filtros/orden/peek y zoom 100/125/200 %. Las capturas locales quedan en screenshots, fuera de Git. `references/` y `references/legacy/` no se mueven ni se publican. La publicación utiliza staging selectivo de frontend, pruebas y documentación; excluye cambios locales ajenos, secretos y artefactos. No modifica Docker ni backend.

Los tokens y las fuentes WOFF2 locales siguen definidos en `app/src/design-system/{tokens,fonts,app,atoms}.css` y `DESIGN.md`; se conservan licencias. `pnpm run check:react` puede detectar el error preexistente del entorno Python ignorado de .opencode; no se modifica esa herramienta ni se ejecuta Foundry.

## Foundry (solo `dev-tvt-foundry`)

`pnpm run check:adoption` usa los verificadores originales cuando el payload interno está presente. No descarga Foundry ni certifica la aplicación. El árbol oficial, la configuración de OpenCode y sus roles permanecen fuera del repositorio y del contexto Docker; la CI pública no depende de ellos.

<!-- tivit-foundry-signature: $2a$12$WX6l8g9An0Tz8UxbqqxV/eEorqzHariOJmGexnJnxM2RA4WtJnYfK -->
