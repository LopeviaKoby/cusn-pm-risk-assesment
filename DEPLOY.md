# Laboratorio conectado: base y aplicación

El backend usa Bun 1.4.4, Hono, Zod, consultas tipadas Drizzle/Bun SQL y PostgreSQL 18.6. El destino es **`pmo_cusn`**, contrato `app/api/migrations/005_pmo_cusn_v200.sql` (adjunto v2.0.0 íntegro), ampliado por `007`–`010`. `pmo` y los demás esquemas ajenos son de solo lectura para esta migración. El alcance sigue siendo desarrollo con datos sintéticos; no autoriza despliegue productivo ni uso compartido.

```text
Navegador → web (NGINX) → /api → API (Bun) → PostgreSQL / pmo_cusn
```

## Variables y arranque

Copia `deploy/env.example` a `.env` y completa las credenciales sin publicarlas. Node 22.23.4 y pnpm 12.12.1 son obligatorios para las herramientas del frontend; `BUN_BIN` permite seleccionar el ejecutable Bun verificado. La API exige `DATABASE_URL` y `GPL_PASSWORD_HASH_B64`; las operaciones de BD usan `MIGRATOR_DATABASE_URL` como propietario. El hash se genera con `pnpm run auth:hash`; no guardes contraseñas en scripts.

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión del rol runtime, sin DDL. |
| `MIGRATOR_DATABASE_URL` | Propietario de los nuevos objetos. |
| `APP_DB_ROLE`, `APP_DB_PASSWORD` | Bootstrap del rol runtime; contraseña necesaria solo para crear uno nuevo. |
| `GPL_USER`, `GPL_PASSWORD_HASH_B64` | Login de laboratorio, contraseña verificada por Bun. El email configurado debe corresponder a un usuario activo existente. |
| `APP_ORIGINS` | Origen exacto de la interfaz; varios separados por coma. |
| `COOKIE_SECURE` | `true` con HTTPS; `false` exclusivamente para HTTP local. |
| `API_HOST`, `API_PORT` | Por defecto `127.0.0.1:3001`. |
| `DB_POOL_MAX`, `GPL_SESSION_MINUTES` | Por defecto 8 conexiones y 60 minutos. |
| `GPL_AS_OF_DATE` | Corte de presentación; las escrituras se registran con el reloj de PostgreSQL. |

```sh
pnpm install --frozen-lockfile
pnpm run db:migrate
pnpm run db:bootstrap
pnpm run db:verify
pnpm run dev:api
# En otra terminal:
pnpm run dev:web:api
```

Detén ambos procesos al terminar. Para contenedores, `compose.yaml` conserva los servicios `db`, `migrate`, `bootstrap`, `verify`, `api` y `web`, pero no se ejecuta un despliegue como parte de la migración. `DB_MIGRATE_MODE=schema` es el único modo admitido por el runner; las antiguas semillas `002/003` fueron retiradas. Las antiguas semillas 002/003 se retiraron del árbol y el migrador solo ejecuta 005–010.

## Migraciones y preservación

`db:migrate` aplica `005`–`010` bajo un bloqueo transaccional. Registra versión y SHA256 en **`pmo_cusn_meta.migracion`**, sin tocar `pmo_meta`. Una segunda ejecución comprueba checksums y no recrea tablas. Un `pmo_cusn` preexistente sin registro de migración se rechaza. No edites migraciones ya aplicadas.

El archivo `005` conserva exactamente el adjunto, incluido su `BEGIN/COMMIT`. El runner retira únicamente esas dos sentencias al ejecutarlo porque Bun controla la transacción. `006` fija `search_path = pmo_cusn, pg_catalog` en las cuatro funciones originales. `007` adapta el parche de Dimensión 3: importes `numeric(20,4)`, ahorro con adjudicación cero, cierre, riesgo transversal, procedencia histórica de hitos, CC del mismo proyecto y SPI porcentual con rango suficiente. `008` deja cuatro roles sin asignaciones automáticas y añade garantías de baseline, seguimiento y aporte único. `009` registra aprobador económico y permite aprobar ese aspecto después de consumir el CC para planificación sin alterar sus campos sustantivos. `010` serializa cambios de riesgos/checklist con el cierre y protege la evidencia de proyectos cerrados hasta su reapertura.

Las diferencias deliberadas frente al bloque SQL literal del informe son: nombres calificados en vez de `SET search_path`; migración versionada sin `IF NOT EXISTS` por columna; `numeric(20,4)` en presupuesto/ahorro frente a `numeric(15,2)`; ahorro calculado también para adjudicación cero; conservación previa de `hito_facturacion.origen` en `origen_legacy` antes de normalizar `Muestra` y el `CAMBIO` sin FK; FK compuesta `(control_cambio_id, proyecto_id)` y unicidad parcial para impedir aportes cruzados o duplicados; `spi numeric(16,4)` frente a `numeric(5,2)` para soportar progreso planificado mínimo válido. No se convirtió ninguna fila histórica en aporte de CC sin equivalencia comprobable.

Hay 49 tablas, 88 FKs, nueve funciones, trece triggers y ocho índices parciales tras el parche. Se precargan nueve unidades (incluida UF, sin EUR), cuatro roles (`ADMIN`, `PM`, `ESPECIALISTA`, `VISUALIZADOR`), 24 permisos y seis ámbitos. **`rol_permiso` queda vacío.** `COORDINADOR` se retira solo si no tiene referencias. El bootstrap concede privilegios SQL sobre el nuevo esquema al runtime, pero no asigna permisos funcionales. El runtime tampoco puede modificar asignaciones, delegaciones ni la matriz de roles.

## Copiar sintéticos desde pmo

El importador anterior de CSV que truncaba `pmo` fue retirado. El nuevo importador solo lee la fuente y exige un destino vacío; no mezcla una carga previa ni borra registros. Primero ejecuta el preflight:

```sh
pnpm run db:import-sample
```

Para aplicar en PowerShell:

```powershell
$env:NODE_ENV='development'
pnpm run db:import-sample --apply
```

`app/api/migrations/import_pmo_v200.sql` contiene la matriz ejecutable de transformación. Conserva IDs y reajusta únicamente las identidades de `pmo_cusn`. Los importes se copian mediante SQL `numeric`, sin conversiones de punto flotante. El reporte muestra conteos antes/después y omisiones por ID; se guarda en `pmo_cusn_meta.importacion` y `.tools/pmo-v200-import.json` (local, fuera de Git). Una carga registrada no se repite.

| Origen | Destino y criterio |
|---|---|
| `catalogo_valor`, atributos de proyecto | `pais`, `lob`, `squad`, `servicio_lob`; servicios solo con pares LOB/servicio observados. Países con equivalencias ISO explícitas. |
| `cliente`, `proveedor`, `proyecto` | IDs conservados; FK organizativas explícitas y estados con normalización ortográfica comprobada. Baseline anterior al inicio queda nula y se reporta; no se inventa una fecha. |
| `especialista`, contactos de proyecto | Usuarios solo con email existente; contactos ligados al cliente correspondiente. Nombres sin identidad no crean usuarios. |
| `proyecto_estado_actual` | `seguimiento_proyecto`, `servicio_operativo`, fechas de proyecto. No se inventan porcentajes o operación donde no aplica. |
| `facturacion`, TCV | `hito_facturacion.real_reportado` y `condicion_comercial` definida cuando hay valor/moneda. No se interpreta como contabilidad ni TCV ilimitado. |
| `compra` | `compra` y `etapa_compra`; después de `007`, el backfill separado copia presupuesto y fechas de recepción solo con ID/proyecto coincidentes. `ahorro` se genera en BD. |
| `riesgo_global`, `riesgo_proyecto` | Entidades distintas; P/I de proyecto pasa a `evaluacion_riesgo`, severidad generada. Controles textuales se vinculan como controles de riesgo. |
| `solicitud_cambio`, sus ámbitos | `control_cambio`, `cambio_ambito`, normalización de firma/urgencia/impacto. Responsables no verificables no se convierten en FK. |
| `cambio_planificacion` | Solicitudes sin CC/actores verificables no se copian ni se convierten en excepciones ficticias. |
| `proyecto_complejidad` | Solo evaluaciones compatibles con fórmula V1 y justificación de override. |
| `proyecto_evento`, `compromiso` | Eventos conservados con contenido/actor de origen en JSONB; compromiso con alcance de país comprobado. |
| `documento_proyecto` | URLs sin ID Drive verificable no se convierten en documentos. |
| Cierres históricos | Estado conservado, validación `SIN_EVIDENCIA_HISTORICA`, nunca APTO inventado. |
| Horas, repases, refresh | Fuera de alcance; permanecen en `pmo`. |

Para completar compras en un laboratorio ya importado, ejecuta `NODE_ENV=development pnpm run db:backfill-business --apply` (en PowerShell, configura `$env:NODE_ENV='development'` antes). El script valida coincidencias y conflictos, reporta conteos antes/después y es repetible. En la muestra actual trasladó 19 presupuestos, 15 fechas esperadas y 11 reales; 0 conflictos, 0 filas modificadas en la segunda ejecución. No había márgenes históricos; tampoco una fecha oficial de cierre verificable. Los 188 hitos `Muestra` y el hito `CAMBIO` sin CC conservaron su `origen` original en `origen_legacy`, con origen operativo `MANUAL`, sin atribución ficticia.

## Reset exclusivo de desarrollo

La migración normal nunca resetea. El comando separado solo admite loopback, entorno development, el nombre exacto de BD y `--schema=pmo_cusn`. Comprueba dependencias externas antes de `DROP SCHEMA pmo_cusn CASCADE`; si hay alguna, aborta. Borra únicamente registros de migración/importación propios y vuelve a aplicar la base. No elimina la BD, el volumen, `pmo` ni `pmo_meta`.

```powershell
$env:NODE_ENV='development'
$env:PMO_ALLOW_RESET='pmo_cusn'
$env:PMO_DEV_DATABASE='nombre-exacto-bd-desarrollo'
pnpm run db:reset:dev
```

No uses eliminaciones de volúmenes ni restauraciones con `--clean` en la BD compartida por esquemas.

## Contratos, permisos y límites

Se conservan `/api/v1/sesion`, `/catalogos`, `/datos`, `/proyectos`, `/riesgos`, `/facturacion`, `/compras`, `/cambios-planificacion`, las rutas de detalle/historial y los PATCH de proyecto/riesgo. Siguen usando `{data}` y errores con código, campos y request ID. No había paginación de servidor; los filtros existentes se conservan. IDs bigint y decimales viajan como texto; la interfaz aplica formato numérico solo para presentación. El DTO agregado añade `usuarioActualId`; los IDs globales se distinguen en el adaptador visual para evitar colisiones con riesgos de proyecto.

La identidad se vincula después de verificar la contraseña del login configurado. No se confía en un email enviado en un PATCH. Los permisos se verifican en servidor y se acotan a GLOBAL/PAIS/PROYECTO; una delegación debe estar activa, autorizada, vigente y derivar de un permiso delegable que el delegante conserve. No existe herencia de ADMIN ni permisos por omisión. La matriz funcional sigue pendiente: una instalación limpia deniega acceso hasta una asignación revisada. No concedas permisos automáticamente para facilitar una prueba.

Un PATCH de estado escribe proyecto y evento append-only en una transacción. El seguimiento anexa registros con ambos porcentajes; `spi` es generado en BD como porcentaje decimal y `spiRatio` continúa en el DTO por compatibilidad. La escala de riesgo es 1–4 y cada revisión anexa evaluación; `Controlado` no implica una transición automática. Los cambios directos de fecha responden `409 PLAN_CHANGE_REQUIRED`. Las solicitudes usan CC firmado disponible o excepción justificada y la resolución aprobada cambia fecha y solicitud en una transacción, sin modificar baseline. La aprobación económica del CC crea un único hito trazable (beneficio positivo, costo TIVIT negativo); exige período explícito cuando existe importe. El cierre exige checklist definido/completo, documentos vigentes requeridos, una lección válida y ausencia de riesgos de proyecto pendientes o en contingencia; `Transferir` vigente cierra con observaciones. Cierre/reapertura estampan o limpian fecha/mes y anexan evento atómicamente. Altas generales de proyectos, SSO, integración Drive y contabilidad siguen fuera de esta entrega.

Los DTO de proyecto añaden `spiPercent`, `cpiPercent`, `desviacionDias` y `salud` (plazo, costo, riesgo, calidad); CPI usa `real_reportado` frente al plan acumulado hasta el mes de corte inclusive, dentro de una misma unidad monetaria y proyecto. Denominador cero devuelve `null`. Los DTO de compra añaden ahorro generado, fechas de recepción y lead times de días calendario calculados con fechas de Santiago; una etapa sin referencia formal o sin fecha no produce un lead time ficticio. Estos campos son adicionales al contrato que consume React.

Rutas de negocio adicionales (cookie y origen existentes, envoltorio `{data}`): `POST /api/v1/proyectos/:id/cierre` con `{}`, `POST /api/v1/proyectos/:id/reapertura` con `{motivo}`, `POST /api/v1/proyectos/:id/cambios-planificacion` con `campo`, `valorPropuesto` y `controlCambioId` o `justificacionExcepcion`, `POST /api/v1/cambios-planificacion/:id/resolucion` con `decision`, `POST /api/v1/controles-cambio/:id/aprobacion-economica` con `periodo` `YYYY-MM`, y `GET/POST /api/v1/riesgos/transversales` más `PATCH /api/v1/riesgos/transversales/:id`. La entidad del DTO de riesgo distingue catálogo global de riesgo transversal evaluable. Los permisos se comprueban en servidor y la matriz sigue pendiente; sin grants explícitos, la API deniega estas operaciones.

## Verificación reproducible

La interfaz consume además `GET /api/v1/controles-cambio`, `GET /api/v1/proyectos/:id/prevalidacion-cierre`, `POST /api/v1/proyectos/:id/complejidad` y `PATCH /api/v1/compras/:id`. La resolución admite `nota`, almacenada atómicamente como evento del proyecto. Complejidad exige `complejidad.evaluar` y, para excepción, `complejidad.override`; compras exige `compras.gestionar`. La prevalidación de cierre exige permiso de cierre y consulta, y no reemplaza la validación transaccional final. Las vistas nuevas usan el diálogo Radix existente con confirmación de descarte. La bandeja consulta cada 15 segundos, al recuperar foco y después de resolver; no utiliza WebSocket.

`db:verify` comprueba las 49 tablas, objetos, unidades, roles, versiones y todas las FKs (cero huérfanos). `db:models` regenera los modelos de las 49 tablas desde el catálogo; `db:models:check` detecta divergencia frente a las migraciones aplicadas, con checks, relaciones, claves e índices; Drizzle tipa las proyecciones usadas por los nuevos casos de uso, sin generar DDL. `test:domain` ejecuta `bun test` para fórmulas y validaciones puras.

`test:db` exige una BD **aislada** cuyo nombre sea `pmo_test` o `pmo_test_*`; no modifica la matriz funcional del laboratorio principal. Prepara PostgreSQL 18.6 desechable y configura:

```powershell
$env:NODE_ENV='test'
$env:TEST_DATABASE_URL='postgres://usuario:clave@127.0.0.1:puerto/pmo_test'
pnpm run test:db
```

La suite instala en limpio, usa fixtures de autorización explícitos y prueba integridad, transacciones con rollback real, delegaciones, inmutabilidad, CC y requests/responses de las rutas existentes. La repetición de la suite requiere una BD de pruebas nueva o el reset protegido de su `pmo_cusn`. Detén y retira el contenedor de pruebas al terminar. Ejecuta además tipos y build frontend/API, cobertura, E2E, distribución, auditoría y firmas según README. El sello Foundry se verifica por separado: las pruebas de aplicación no son certificación del framework.

Después de `test:db`, para repetir el render conectado con esos fixtures: compila `pnpm run build:api` y arranca `node scripts/run-bun.mjs run app/api/tests/serve-fixture.ts` con el mismo `NODE_ENV=test` y `TEST_DATABASE_URL`. Ese servidor escucha en `127.0.0.1:43001`, usa una contraseña exclusiva del fixture y no concede permisos. En otra terminal PowerShell:

```powershell
$env:GPL_API_TEST='1'
$env:API_PROXY_TARGET='http://127.0.0.1:43001'
$env:PLAYWRIGHT_CHANNEL='msedge'
pnpm exec playwright test tests/e2e/api.spec.ts
```

El runner inicia/cierra el preview en 4173. El fixture debe detenerse con Ctrl+C al terminar; no lo uses con el `DATABASE_URL` principal. `API_PROXY_TARGET` configura exclusivamente el proxy Vite/preview (por defecto 3001). El E2E sin API verifica el estado de error del login. Para detener los procesos de la prueba si quedaron en segundo plano y apagar solo el contenedor local `tvt-pmo-db` (sin borrar su volumen), ejecuta desde PowerShell en la raíz del repositorio:

```powershell
.\scripts\stop-local.ps1
```

El script solo termina listeners de 4173/43001 si su línea de comando coincide con Vite preview/fixture; deja cualquier proceso no reconocido intacto. `-KeepDatabase` detiene la interfaz y el fixture, pero deja PostgreSQL encendido. `-WhatIf` muestra las acciones sin ejecutarlas.
