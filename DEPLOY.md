# Backend PMO v2.1.0 — ejecución y verificación

El corte backend comprende acceso propio, gobierno F1–F7 y la entrega vertical **G1** (workspaces, asignaciones, alta/edición base, portafolio denso y ficha de presentación del proyecto). Se verificó localmente con PostgreSQL 18.6, Bun 1.4.4, Hono 4.13.14, Zod 4.6.7, Drizzle 0.45.4, jose 6.2.13, Node 22.23.4 y pnpm 12.12.1. No constituye despliegue productivo ni validación de los dominios posteriores (`P1–P6`) o del frontend.

## Arquitectura y contratos

La API única está en `app/api/`. `src/index.ts` exporta el mismo Hono utilizado por las pruebas conectadas y por `Bun.serve`. No hay un enrutador v2.0 paralelo. Los handlers/repositorios incompatibles, importador/backfill v2.0 y su smoke fueron retirados. Complejidad (`P1`), riesgos (`P2`), controles de cambio/solicitudes de plazo (`P3`), seguimiento/facturación/SPI-CPI (`P4`), compras (`P5`) y cierre/documentos (`P6`), así como Drive, horas y repases, no tienen endpoints en este corte; rutas no registradas responden 404 y la ficha/portafolio exponen sus bloques futuros como `null` / `PENDIENTE_*` sin simular valores ni ceros de relleno.

`infrastructure/http/contracts.ts` define entradas estrictas y DTO separados de entidades. La inscripción de rutas usa esos esquemas para validar solicitudes y respuestas y generar OpenAPI 3.1. El documento se sirve en `GET /api/v1/openapi.json` y está versionado en `specs/openapi-v210.json`. `api:openapi:check` rechaza divergencias. Campos no declarados, incluidos rol/titular/workspace/estado/fechaTerminoActual en una edición ordinaria, se rechazan; no hay mass assignment.

Éxito: `{data: DTO}`. Error: `{error:{code,message,fields?},requestId}`, sin SQL/stack. Validación 422, JSON inválido 400, autenticación 401, autorización 403, inexistencia 404, versión/unicidad/exclusión/baseline inmutable 409, token no vigente 410, tamaño 413, Content-Type 415, interno 500 y conexión 503. Detalles sin alcance devuelven 403 antes de revelar existencia; Head obtiene 404 si el recurso no existe. `GET /api/v1/proyectos` conserva `after` y `limit` (1–100, defecto 50); `GET /api/v1/portafolio` y `GET /api/v1/workspaces/:id/proyectos` proveen búsqueda (`q`), filtros (`workspaceId`, `paisId`, `lobId`, `squadId`, `clienteId`, `pmTitularId`, `estado`, `incluirInactivos` exclusivo Head), ordenamiento, paginación y `resumenPorEstado`. Identificadores, cursores y versiones se transportan como cadenas y validan cota superior `BIGINT` (`<= 9223372036854775807`) con `422` en frontera; el DTO oculta referencias internas (`sap/ceco/pep`), correos internos y suplencias a perfiles `EXTERNO`.

| Persistencia SQL | Proyección Drizzle | Servicio | DTO/operaciones |
|---|---|---|---|
| usuario, rol, permiso, asignacion_rol | schema.ts, símbolos homónimos | session.ts; application/users | sesión, asignación, desactivación, recuperación |
| workspace, membresia_workspace | workspace, membresia_workspace | workspaces/create y manage | workspace, detalle/permisos/resumen, miembros, elegibles, habilitación, estado de membresía |
| invitacion_workspace | invitacion_workspace | workspaces/invitation y manage | emisión controlada, listado sin token, aceptación y revocación |
| proyecto, participacion_proyecto, cliente, pais, lob, servicio_lob, squad | símbolos homónimos | projects/create/edit/transfer/participation/portfolio | alta/edición con baseline inmutable, portafolio denso, ficha de presentación, asignaciones, catálogos, transferencia, participante |
| delegacion_acceso, delegacion_permiso | símbolos homónimos | projects/substitution; authorization.ts | suplencia UTC (por Head o PM titular vigente, incluido titular reasignado), revocación |
| auditoria_seguridad, evento_proyecto | símbolos homónimos | transacciones de aplicación y error handler | sin CRUD público |

`models.ts` contiene las 53 entidades y metadatos completos de FK, checks, exclusiones e índices. `schema.ts` proyecta sus columnas, tipos, nulabilidad, defaults, identidades, PK simples y expresiones generadas para Drizzle. Las FKs compuestas, índices, exclusiones y triggers conservan su autoridad en SQL versionado, no se sustituyen por sincronización ORM. Lectura y edición ordinaria de proyectos ejecutan Drizzle real; servicios con restricciones avanzadas usan Bun SQL transaccional. La suite prueba bigint superior a MAX_SAFE_INTEGER, decimal exacto, NULL, date, timestamptz y columnas generadas.

## Configuración y autenticación

Copiar `deploy/env.example` a un archivo local ignorado. `DATABASE_URL` corresponde al runtime; `MIGRATOR_DATABASE_URL` al operador. `JWT_SIGNING_KEY` exige al menos 32 bytes aleatorios y nunca usa prefijo VITE_. `APP_ORIGINS` contiene orígenes exactos. Arquitectura web de mismo origen con proxy /api: no se habilita CORS abierto. Todas las escrituras exigen Origin autorizado y los cuerpos declarados exigen application/json. `COOKIE_SECURE=true` es obligatorio salvo HTTP localhost/127.0.0.1.

Contraseñas Argon2id de Bun (64 MiB, dos iteraciones), mínimo 14 caracteres en alta/recuperación. Cinco fallos bloquean login 15 minutos; el contador y la decisión se serializan con bloqueo de usuario. También se auditan intentos de credenciales no reconocidas sin almacenar el correo enviado. El control adicional de volumen por red y la retención de auditoría son responsabilidad de la operación antes de exposición pública.

Access JWT HS256 de 5 minutos por defecto (máximo 15), con firma, algoritmo, iss, aud, exp, sub, iat, jti y versión de sesión verificados. Se consulta estado/rol vigente en cada solicitud. Refresh opaco de 32 bytes, hash SHA-256, un único refresh activo por cuenta y rotación atómica; vigencia deslizante de 14 días por defecto (máximo 30). Un refresh anterior se rechaza. Cambiar contraseña/rol, revocar rol, desactivar o cerrar sesión invalida los tokens correspondientes. No hay Google OIDC ni autoaprovisionamiento por login.

Tokens solo en cookies HttpOnly/SameSite=Strict/Secure fuera de local. Access Path=/; refresh Path=/api/v1/sesion. No se devuelven en el DTO de sesión ni se almacenan en localStorage. La sesión devuelve el catálogo de permisos del rol; ese catálogo no sustituye autorización por objeto.

## Bootstrap, invitaciones y recuperación

El primer Head se crea por `pnpm run auth:bootstrap-head`, exclusivamente con conexión de operador y:
- BOOTSTRAP_CONFIRM_DATABASE igual al nombre real de BD.
- BOOTSTRAP_HEAD_EMAIL y BOOTSTRAP_HEAD_PASSWORD (14+ caracteres).

El comando se serializa y falla si ya existe un Head vigente; registra auditoría. No existe endpoint público de bootstrap ni registro/promoción.

Head puede emitir recuperación mediante POST /api/v1/usuarios/:id/recuperacion después de verificar la identidad por el procedimiento administrativo aprobado. La respuesta autenticada contiene el token una vez para entrega controlada; delivery=PENDING indica que no se envió notificación. El destinatario usa POST /api/v1/credenciales/restablecer. Solo se almacena hash, expira en 30 minutos, se consume una vez y revoca sesiones. No se configuró ni se afirma probar correo externo.

Invitaciones: mismo mecanismo de entrega controlada, siete días, token hash y uso único. Cuenta existente requiere sesión coincidente; una cuenta nueva recibe el rol de la invitación sin poder elegirlo. PM creador/habilitado solo incorpora Especialista/Visualizador o un PM ya existente como observador; no lo promueve ni habilita creación. Solo Head habilita a otro PM. La participación del proyecto se administra separadamente de la membresía.

## Autorización e integridad

ADMIN global. PM consulta portafolio global pero edita solo titularidad o suplencia efectiva; la membresía/habilitación de creación no concede edición ajena. Especialista y Visualizador asignado leen solo participaciones vigentes; Visualizador interno puede tener alcance global explícito; externo solo Visualizador asignado. Ninguna escritura técnica no especificada se concede al Especialista. La política documental pendiente se deniega a los perfiles sin justificación; este corte no expone documentos.

Las transacciones revalidan actores y objetos. Editar bloquea primero el proyecto y comprueba permiso/versionado; transferir es exclusivo Head, conserva ID/TVT, usa continuidad temporal de titulares, incrementa versión y registra evento/auditoría. Cambiar titular revoca suplencias anteriores. Suplencias solo de PM, Head o titular creador; intervalos explícitos con offset convertidos a UTC [inicio,fin). La API rechaza fechas ingenuas y no interpreta por su cuenta un fin de jornada local. El caller debe enviar el instante con zona ya resuelta; la conversión de calendario local no forma parte de este contrato de instantes.

Los triggers diferidos garantizan exactamente un titular interno/activo/PM/miembro al COMMIT. Retirar rol o membresía sin reemplazo revierte. EXCLUDE protege períodos de titularidad y suplencias incluso bajo concurrencia. La auditoría conserva actor real y delegación utilizada. Denegaciones HTTP se insertan después del rollback de aplicación en una transacción independiente. No se registran contraseñas/tokens.

Runtime: SELECT del esquema PMO y lectura del registro de migración; INSERT/UPDATE solo en las nueve tablas mutables del núcleo de acceso/gobierno; INSERT exclusivo para auditoría/eventos. Sin DELETE/TRUNCATE, DDL, propiedad de esquema, atributos elevados, replicación, bypass RLS ni escritura de catálogos rol/permiso/rol_permiso. No hay grants de escritura automática para tablas futuras: toda ampliación requiere revisar bootstrap y pruebas.

## Baseline y generación

Están activas las migraciones `011_pmo_cusn_v210.sql` (baseline inmutable) y `012_g1_baseline_guard.sql` (inmutabilidad de primera línea base de término y coherencia de `fecha_termino_actual`); `001–010` permanecen como historia del manifiesto. No hay upgrade/backfill v2.0. Se rechaza un pmo_cusn preexistente sin registro. Migración serializada por advisory lock, PostgreSQL 18.6 verificado, checksum de archivo y huella determinista del catálogo. La segunda aplicación no recrea tablas y detecta drift de columnas, restricciones, funciones, triggers, índices y matriz de roles/permisos; la suite verifica también el upgrade incremental `011 -> 012`.

Diferencias con el SQL fuente entregado: campos de autenticación propia en usuario; seeds de permisos aprobados; search_path fijo pmo_cusn,pg_catalog en las diez funciones; comentarios de permisos coherentes con esos seeds. Las instrucciones de negocio prevalecen sobre el catálogo vacío descrito en versiones anteriores. No se aplicaron transformaciones de datos ni se tocó pmo.

- Fuente original SHA-256: 3d7346235175374a175670e9d8b1ce07b67b554ae63eba84958c7767bad98678.
- Baseline 011 SHA-256: 1086974ab85ca82c7919dec353a05394b7d97472fc9571341e19ecabd22cc40d.
- Migración 012 SHA-256: 238222263df86f8ecd961e70fa147ccd307b82ae855e5ef597d92480cc0e4e38.
- Huella del catálogo (011–012): ffeeb9c707e73c91b840cb68c099f79679aca6639ae0138911d96bbbd646ca50.

db:models y db:models:check rechazan primero una huella divergente; generan/comparan tanto entidades como Drizzle. No puede aprobarse una base divergente simplemente regenerando archivos.

## Reproducir aceptación backend

La instancia usada es PostgreSQL 18.6 loopback 127.0.0.1:55434, cluster local desechable .tools/pmo-v210-pg. Migrador/fixtures: pmo_test_owner. API: pmo_test_runtime_v210. Base final: pmo_test_v210_closed. El testigo pmo.sentinel conserva value=intacto. La suite nunca elimina bases y exige una base nueva pmo_test_v210_* sin pmo_cusn; no reutilizar el nombre final para repetirla.

En PowerShell, con PostgreSQL 18.6 local ya escuchando:

~~~powershell
$env:PGHOST='127.0.0.1'
$env:PGPORT='55434'
$env:PGUSER='pmo_test_owner'
createdb.exe pmo_test_v210_otro_sufijo
$env:NODE_ENV='test'
$env:TEST_DATABASE_URL='postgres://pmo_test_owner@127.0.0.1:55434/pmo_test_v210_otro_sufijo'
$env:TEST_API_DATABASE_URL='postgres://pmo_test_runtime_v210@127.0.0.1:55434/pmo_test_v210_otro_sufijo'
pnpm run test:db
pnpm run typecheck:api
pnpm run test:domain
pnpm run build:api
~~~

Las URLs anteriores aprovechan trust local de la instancia desechable. En un servidor con autenticación deben usarse credenciales locales de prueba en variables, nunca en archivos versionados. Si el rol runtime aún no existe, incluir una contraseña aleatoria de 12+ caracteres en su URL: el bootstrap la crea con atributos restringidos. La suite genera las contraseñas de actores y JWT en memoria.

La suite ejecuta instalación limpia/repetición, drift de registro y ALTER TABLE de prueba (restaurados), bootstrap, auth, Hono+BD con runtime separado, concurrencia, contratos, Drizzle, TCP y comprobaciones de modelos/OpenAPI. El proceso TCP se termina en finally; no finaliza procesos ajenos. Resultados por script y códigos de salida quedan en .tools/backend-v210-evidence/results.json (local ignorado).

| Caso | Cobertura final | Test |
|---|---|---|
| T01 | Admin/PM crea; slug y membresía habilitada atómica | workspace-http, projects-http |
| T02 | Especialista/Visualizador 403 | workspace-http |
| T03 | PM sin habilitación 403 | projects-http |
| T04 | Habilitado crea y sigue sin editar proyecto ajeno del mismo workspace | access-contracts |
| T05 | TVT normalizado concurrente 201/409 y exactamente una fila | access-contracts |
| T06 | Sin titular/dos titulares rechazados al COMMIT/UNIQUE | schema-invariants |
| T07 | No PM/no miembro/inactivo; externo rechazado por rutas de titularidad y rol | schema-invariants, access-contracts |
| T08 | PM global lee; ajeno no edita | substitution-http |
| T09 | Invitaciones PM limitadas; observador no obtiene creación | governance-http |
| T10 | PM no asigna ADMIN ni origina PM nuevo | governance-http |
| T11 | Solo Head transfiere; TVT/ID intactos, versión y titular | transfer-http |
| T12 | Suplencias concurrentes 201/409 | substitution-http |
| T13 | Pendiente/revocada/vencida sin edición | substitution-http |
| T14 | Titular/suplente editan; actor/delegación auditados | substitution-http |
| T15 | Misma versión concurrente 200/409 | projects-http |
| T16 | Externo GLOBAL rechazado | governance-http |
| T17 | Vencida/revocada/reutilizada rechazada; aceptación concurrente 200/410 | governance-http, access-contracts |
| T18 | Auditoría UPDATE/DELETE bloqueados por trigger y privilegios | schema-invariants, access-contracts |
| T19 | Revocar rol/retirar membresía del titular revierte | schema-invariants |
| T20 | pmo intacto tras migración/repetición y pruebas | schema-invariants |
| G1 | Detalle/miembros/invitaciones (sin token)/elegibles de workspace, catálogos, suplencia por titular reasignado, alta/edición con primera línea base inmutable, portafolio denso paginado, ficha con confidencialidad y cota BIGINT | g1-portfolio-http, schema-invariants, access-contracts |

En la revisión final todos los casos anteriores y los scripts adicionales auth-http/auth-negative/recovery-http/projection/tcp-smoke terminaron con exit 0. TCP final: PID 24676, puerto 49403, proceso terminado al cerrar la prueba. typecheck:api, build:api y 8 pruebas puras de dominio pasaron; las pruebas puras heredadas de dominios aplazados no declaran esos servicios funcionales. pnpm audit completo: sin vulnerabilidades conocidas; audit signatures: 617 firmas verificadas tras corregir seis avisos del tooling de desarrollo. Overrides exactos: glob 13.0.6→14.0.2, minimatch 10.2.6→11.0.1 y fast-uri 3.1.8→3.1.9. Se revisaron fuentes, licencias, integridad, scripts, motores y antigüedad; no se habilitaron scripts nuevos ni excepciones de confianza/antigüedad. Storybook compiló; React Doctor en worktree limpio terminó con 0 errores y 31 advertencias preexistentes. No se modificaron componentes frontend.

Fallos corregidos durante el cierre: conteo T05 consultaba TVT sin normalizar; bloqueo FOR SHARE del catálogo rol exigía privilegio indebido y se limitó a usuario/asignación; errores SQL genéricos ya no se presentan como indisponibilidad de conexión; se añadió diagnóstico sanitizado al smoke TCP tras un fallo intermedio no reproducido en la ejecución final.

CI mantiene separado el job backend: typecheck, dominio, suite completa con rol runtime, comparación de modelos/OpenAPI, build backend e imagen. No se desactivaron gates frontend preexistentes; no son requisitos del cierre backend local. Consultar el resultado remoto del commit publicado antes de afirmar CI verde. Docker daemon local no estuvo accesible; la imagen local no queda acreditada por las pruebas TCP. CodeGraph no tenía índice, por lo que no condicionó las pruebas.

Referencias contrastadas: [Hono testing](https://hono.dev/docs/guides/testing), [Zod JSON Schema](https://zod.dev/json-schema), [Bun SQL](https://bun.com/docs/runtime/sql), [Drizzle Bun SQL](https://orm.drizzle.team/docs/connect-bun-sql), [PostgreSQL 18 privilegios](https://www.postgresql.org/docs/18/ddl-priv.html), [OWASP contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). La guía Drizzle pública muestra paquetes RC actuales; se conservó 0.45.4 y su API comprobada con consultas/mutaciones reales, sin cambiar a RC ni Drizzle Kit.
