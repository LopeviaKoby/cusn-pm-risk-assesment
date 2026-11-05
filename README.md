# GPL — Gestión de proyectos y riesgos

Frontend local de demostración para seguimiento de proyectos, riesgos, revisión humana de sugerencias y análisis de portafolio. Usa datos ficticios; el artefacto demo no incluye backend, OAuth, integraciones ni IA real. El entorno local añade una API Bun y PostgreSQL 18.6 con datos sintéticos. El acceso y el almacenamiento local no protegen información privada.

El repositorio publicado sirve el artefacto **demo**. Además incluye un **entorno local de lectura y edición** (Bun 1.4.4 + PostgreSQL 18.6) que se ejecuta aparte, no forma parte del build publicado y no habilita uso corporativo. El plan y sus límites están en [`specs/migracion-apps-script-a-bun.md`](specs/migracion-apps-script-a-bun.md).

## Stack y requisitos

- React 19.3.0, TypeScript 7.0.2, Vite 8.3.4, Tailwind CSS 4.3.3, Radix Dialog 1.3.1 y Tabs 1.2.1, y Motion 14.2.0.
- Node.js **22.23.4** y pnpm **12.12.1** exactos, fijados en `package.json`; `pnpm-lock.yaml` resuelve las dependencias.
- Entorno local: Bun **1.4.4** y PostgreSQL **18.6** en Docker. No son dependencias del frontend ni del build publicado.
- Git; para contenedores, Docker con motor Linux y acceso a Docker Hub, GHCR y al registro oficial npm.

No cambies Node ni pnpm: la versión de Node incorpora la corrección de seguridad oficial. Instala Node desde su distribución oficial y el binario independiente de [pnpm 12.12.1](https://github.com/pnpm/pnpm/releases/tag/v12.12.1); verifica su procedencia y añade ambos a `PATH`. Docker no requiere Node ni pnpm en el host.

## Instalación y ejecución local

```sh
git clone --branch dev https://github.com/LopeviaKoby/cusn-pm-risk-assesment.git
cd cusn-pm-risk-assesment
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run dev
```

Vite sirve en loopback; abre la URL que imprime y detén el proceso con `Ctrl+C`. No se necesita ningún archivo `.env`.

La política de `pnpm-workspace.yaml` conserva registro HTTPS, antigüedad mínima de siete días, comprobación de confianza, engines/peers estrictos y scripts de dependencias sin autorización general. No cambies el lockfile para sortear errores ni uses `pnpm dlx` o generadores sin revisión.

## Comprobaciones

```sh
pnpm run validate:demo
pnpm run test:demo
pnpm run test:coverage
pnpm run typecheck
pnpm run build
pnpm run test:e2e
pnpm run typecheck:api
pnpm run test:db
pnpm run build:api
pnpm run check:react
pnpm run check:distribution
pnpm audit
pnpm audit signatures
pnpm ls --depth Infinity
pnpm run preview
```

`validate:demo` valida los fixtures y los casos de control. `test:demo` ejecuta las pruebas de datos; `test:coverage` mide records, finanzas, acceso, navegación, primitivas, diálogo y carga de rutas con umbrales por archivo, no toda la aplicación. `typecheck` incluye las pruebas. `build` genera el frontend estático; `preview` lo sirve en `127.0.0.1:4173` hasta `Ctrl+C`.

`typecheck:api` revisa el servidor y las migraciones. `test:db` requiere `tvt-pmo-db` y el `.env` local: comprueba 24 tablas, 9 unidades, precisión de `numeric`/`bigint`, fechas, JSONB, rollback de transacción y el rol runtime sin DDL. `build:api` compila el frontend en modo `api`; no sustituye al build demo de CI.

Playwright usa Page Objects y comprueba acceso, historial, pestañas por teclado, formularios, persistencia, reglas axe WCAG A/AA y capturas a 1440 y 390 px. Las violaciones de axe y las diferencias visuales fallan; no actualices las referencias para ocultarlas. En Windows puede usarse Edge con `$env:PLAYWRIGHT_CHANNEL='msedge'`; en otros entornos, instala Chromium con `pnpm exec playwright install chromium`. El runner inicia y cierra su propio servidor; `PLAYWRIGHT_BASE_URL` permite probar un contenedor local cuyo ciclo de vida controla quien lo ejecuta.

`check:react` es un análisis adicional y `check:distribution` revisa la distribución. Las auditorías requieren red. La excepción revisada `semver@6.3.1` está documentada en `pnpm-workspace.yaml`; no amplíes excepciones sin revisión.

## Docker

El Dockerfile multietapa fija versiones y digests de Node, pnpm y NGINX. El build ejecuta validación, cobertura, tipos y compilación. La imagen final sirve el frontend con NGINX 1.30.6 sobre Alpine 3.24, usuario `101:101` y puerto 8080, con cabeceras CSP, DENY, nosniff y Referrer-Policy. No incluye Node, pnpm ni el código fuente de la aplicación.

```sh
docker build --pull -t gpl-frontend:local .
docker run --rm -d --name gpl-demo --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --cap-drop ALL --security-opt no-new-privileges=true -p 127.0.0.1:8080:8080 gpl-frontend:local
docker inspect --format '{{.State.Health.Status}}' gpl-demo
```

Abre [GPL local](http://127.0.0.1:8080). La comprobación de salud tarda unos segundos. Las rutas SPA admiten acceso directo y recarga; un asset inexistente responde 404. El contenedor solo necesita `/tmp` escribible. Para detenerlo y eliminarlo:

```sh
docker stop gpl-demo
docker ps --filter name=gpl-demo
```

Opcionalmente, con Docker Scout disponible y su sesión iniciada, analiza la imagen sin publicarla:

```sh
docker scout cves local://gpl-frontend:local --only-severity critical,high --exit-code
```

No se necesita ningún volumen ni servicio externo. Reiniciar Docker no crea persistencia compartida ni guarda registros en el contenedor.

## Despliegue en infraestructura

El repositorio incluye `compose.yaml` para levantar `db`, `migrate`, `bootstrap`, `verify`, `api` y `web`. Solo el frontend publica un puerto; la base y la API quedan en una red privada. La guía completa, con variables, demo, datos autorizados, verificación, copias y rollback, está en [DEPLOY.md](DEPLOY.md).

En resumen:

- **Demo:** `DB_MIGRATE_MODE=demo` carga catálogos y 8 proyectos sintéticos. Es una demostración, no producción.
- **Producción:** `DB_MIGRATE_MODE=schema` crea solo la estructura y las unidades; los datos se cargan aparte con un proceso autorizado.

```sh
cp deploy/env.example .env
docker compose up -d --build
```

El commit no transporta una base de datos: transporta el SQL y las herramientas. La base vive en la infraestructura y se crea al aplicar las migraciones.

## Acceso y rutas

Cuenta **ficticia y pública, no segura**: `pm@gpl.example.test` / `GPL-local-2026!`. No la reutilices en otro servicio. La comprobación está en el frontend; un indicador no sensible de sesión ocupa `sessionStorage`, sin contraseñas ni tokens persistidos.

| Ruta | Contenido |
|---|---|
| `/workspace` | Por revisar, seguimiento y vista previa contextual. |
| `/proyectos` | Explorador, filtros y alta manual. |
| `/proyectos/:projectId/resumen` | Identidad, avance, seguimiento y síntesis económica. |
| `/proyectos/:projectId/ejecucion` | Curva de avance, hitos e historial. |
| `/proyectos/:projectId/riesgos` | Registro del proyecto, sugerencias separadas y alta manual. |
| `/proyectos/:projectId/riesgos/:riskId` | Detalle del riesgo del proyecto. |
| `/proyectos/:projectId/sugerencias/:suggestionId` | Revisión humana de una propuesta. |
| `/riesgos` y `/riesgos/:riskId` | Registro global y detalle transversal. |
| `/portafolio` | Visión general. |
| `/portafolio?vista=finanzas` | Comparación financiera por moneda y periodo. |

Sin sesión, las rutas llevan a Login; tras entrar se retoma el destino. Light es inicial y Dark se puede seleccionar durante la sesión. La [guía de demostración](GUIA_DEMO.md) propone un recorrido breve.

## Persistencia y límites

Los JSON son semilla determinista de solo lectura, con corte `2026-10-20`. Las altas manuales se superponen mediante la clave `localStorage` **`gpl.demo.records.v1`**. Se leen formatos 1 y 2; el próximo guardado válido escribe versión 2 conservando registros anteriores. Datos inválidos o un fallo de almacenamiento producen error, sin borrar silenciosamente el contenido anterior ni simular un guardado.

Los registros locales pertenecen **solo al mismo navegador y origen** (protocolo, host y puerto). `localhost`, `127.0.0.1`, Vite y Docker pueden tener almacenes distintos. No son almacenamiento seguro ni multiusuario. Para restablecer deliberadamente solo la semilla de GPL, ejecuta en la consola de ese origen y recarga:

```js
localStorage.removeItem("gpl.demo.records.v1");
location.reload();
```

Las decisiones de propuestas IA mantienen su alcance de sesión y se reinician al recargar o salir. Las propuestas siguen separadas de los riesgos oficiales hasta una aprobación explícita. No hay gestión completa del ciclo de vida ni edición de avance, compras, horas o finanzas.

## Modo demo y entorno local conectado

El modo de datos se elige al construir: `demo` o `api`, sin fallback automático por error. El build y la CI por defecto siguen siendo `demo`, con fixtures JSON y `localStorage`.

El entorno local usa PostgreSQL 18.6 en el contenedor `tvt-pmo-db`, migraciones versionadas y una API Bun en `127.0.0.1:3001`. La interfaz en modo `api` se inicia con `pnpm run dev:web:api` y consume `/api/v1`; no carga fixtures de negocio.

Requisitos: Docker, Bun 1.4.4 (`BUN_BIN` o `.tools/bun-1.4.4`) y un `.env` local con `DATABASE_URL`, `MIGRATOR_DATABASE_URL`, `GPL_USER` y `GPL_PASSWORD_HASH_B64`. El `.env` no se publica. Si falta, la API no arranca.

```sh
docker start tvt-pmo-db
pnpm run db:migrate:demo
pnpm run dev:api
pnpm run dev:web:api
```

`db:migrate` aplica solo estructura y unidades; `db:migrate:demo` añade catálogos y 8 proyectos sintéticos. `db:import-sample` reemplaza la semilla por la muestra local indicada, trunca las 24 tablas y verifica cada conteo; los CSV no se publican ni se copian al repositorio. `db:bootstrap` crea o actualiza el rol runtime, `db:verify` comprueba el esquema y los permisos, y `auth:hash` genera el hash de acceso. El paquete de infraestructura está en [DEPLOY.md](DEPLOY.md).

El entorno local permite consultar y editar proyectos y riesgos, además de revisar catálogos, seguimiento, portafolio y finanzas. La creación de proyectos y riesgos (T-06) y el cierre siguen pendientes; los botones de alta no se muestran en modo `api`.

Cualquier uso compartido queda bloqueado hasta resolver identidad, autorización, catálogos y conciliación. La sesión local no es un control de seguridad ni aislamiento multiusuario,.

## Lectura de los importes

**TCV** es valor comercial total; **ACV**, el plan comercial anual. Son distintos del presupuesto operativo, que permanece sin dato cuando no hay fuente. La facturación conserva tres referencias independientes: Showpricing original, planificado por PM y real registrado. Cada serie se agrupa por su propia fecha; `null` significa ausencia y `0` un importe registrado.

Finanzas filtra una sola moneda y no aplica conversiones. La diferencia comparable suma real menos plan únicamente en pares proyecto/mes con ambos valores. El real no es pronóstico y solo se presenta como factura emitida cuando existe referencia explícita. Los egresos esperados/reales por compras se muestran aparte: no se restan para inventar margen o presupuesto.

## Distribución, licencias y adopción local

Todo dato de negocio publicado es ficticio y los fixtures importados son públicos en el navegador. Las carpetas privadas de requisitos y referencias visuales, archivos de entorno, cachés, salidas de pruebas y herramientas locales se excluyen de Git y del contexto Docker; no deben importarse desde el frontend. Revisa también `dist/` antes de distribuir.


Google Sans y Manrope conservan sus licencias SIL OFL 1.1 y avisos de autoría en `src/assets/fonts/`. El build los publica en `/licenses/google-sans.txt` y `/licenses/manrope.txt`, junto con `/licenses/dependencies.txt` para las dependencias empaquetadas. La autorización del 21 de octubre de 2026 para redistribuir `tivit-logo-no-bg.png` y `tivit-login-banner.jpeg` no concede una licencia general sobre las marcas. Se conservan las licencias y avisos de las skills incluidas; no se concede aquí una licencia distinta para materiales de terceros.

