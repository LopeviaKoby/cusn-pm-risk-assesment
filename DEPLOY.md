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
| proyecto, participacion_proyecto, cliente, pais, lob, servicio_lob, squad | símbolos homónimos | projects/create/edit/transfer/participation/portfolio | alta/edición con baseline inmutable, portafolio denso, ficha de presentación, asignaciones, transferencia, participante |
| cliente, pais, lob | símbolos homónimos | application/clients | búsqueda paginada/alta de cliente y listas de países/LOB |
| delegacion_acceso, delegacion_permiso | símbolos homónimos | projects/substitution; authorization.ts | suplencia UTC (por Head o PM titular vigente, incluido titular reasignado), revocación |
| auditoria_seguridad, evento_proyecto | símbolos homónimos | transacciones de aplicación y error handler | sin CRUD público |

`models.ts` contiene las 53 entidades y metadatos completos de FK, checks, exclusiones e índices. `schema.ts` proyecta sus columnas, tipos, nulabilidad, defaults, identidades, PK simples y expresiones generadas para Drizzle. Las FKs compuestas, índices, exclusiones y triggers conservan su autoridad en SQL versionado, no se sustituyen por sincronización ORM. Lectura y edición ordinaria de proyectos ejecutan Drizzle real; servicios con restricciones avanzadas usan Bun SQL transaccional. La suite prueba bigint superior a MAX_SAFE_INTEGER, decimal exacto, NULL, date, timestamptz y columnas generadas.

## Contrato de selección y alta de cliente para el agente frontend

| Recurso | Entrada y shape data | Acceso / errores |
|---|---|---|
| GET /api/v1/clientes | q opcional (trim, 1–120), limit 1–100 (defecto 50), after ID string opcional (defecto 0). {items:[{id,nombre,sector,estadoCliente}],paginacion:{limit,total,hasMore,nextCursor}} | ADMIN/PM internos activos con proyectos.consultar; 401/403/422/5xx |
| POST /api/v1/clientes | {nombre,estadoCliente:NUEVO|ANTIGUO}: clasificación manual obligatoria, trim 1–200; 201 {data:{id,nombre,sector:null,estadoCliente}} | ADMIN/PM internos activos y clientes.crear independiente; Origin y JSON; 401/403/400/413/415/422/5xx |
| GET /api/v1/paises | {data:[{id,codigo,nombre}]}: todos los activos | Política G1 interna con proyectos.consultar; 401/403/5xx; no filtros ni administración |
| GET /api/v1/lobs | {data:[{id,nombre}]}: todas las activas | Política G1 interna con proyectos.consultar; 401/403/5xx; no filtros ni administración |

La búsqueda de clientes usa ILIKE parametrizado y trata %, _ y barra inversa como texto literal. Ordena por ID numérico ASC (no por su alias convertido a texto). after es el cursor exclusivo; se conserva q/limit al solicitar la siguiente página. total cuenta todos los clientes activos del filtro, sin after; nextCursor solo se devuelve si hasMore. Cambiar q reinicia el cursor. No se carga la tabla completa ni se mezclan formatos offset/cursor.

Flujo: buscar coincidencias → registrar si el usuario decide crear → usar el id confirmado del POST como clienteId → POST /proyectos con paisId/lobId persistentes y workspace autorizado. Denominaciones repetidas son válidas y crean IDs distintos; no hay 409 por nombre ni fusión automática. No reintentar automáticamente un POST incierto: este contrato no introduce clave de idempotencia.

clientes.crear es una **propuesta nueva del propietario**, autorizada para desarrollo y pendiente de ratificación explícita para producción; no se deriva de proyectos.crear. La migración añade solo el permiso y dos concesiones, y bootstrap concede solo INSERT cliente al runtime. Crear y auditar son atómicos; las denegaciones usan la auditoría HTTP existente.

GET /api/v1/catalogos y cualquier derivado quedan retirados: 404 y ausencia de OpenAPI, sin alias/redirección. servicio_lob, squad y demás maestros no reciben CRUD ni recursos nuevos en este corte. Elegibles, portafolio, proyectos por workspace, asignaciones y ficha G1 conservan su contrato. El frontend publicado debe integrar estas rutas en otra entrega: no se modificó su código aquí.

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

Runtime: SELECT del esquema PMO y lectura del registro de migración; INSERT/UPDATE solo en las nueve tablas mutables del núcleo de acceso/gobierno; INSERT exclusivo para auditoría/eventos y cliente (extensión G1 propuesta para desarrollo). Sin DELETE/TRUNCATE, DDL, propiedad de esquema, atributos elevados, replicación, bypass RLS ni escritura de catálogos rol/permiso/rol_permiso. No hay grants de escritura automática para tablas futuras: toda ampliación requiere revisar bootstrap y pruebas.

## Baseline y generación

Están activas las migraciones `011_pmo_cusn_v210.sql` (baseline inmutable), `012_g1_baseline_guard.sql` (inmutabilidad de primera línea base de término y coherencia de `fecha_termino_actual`) y `013_clientes_crear.sql` (permiso/concesiones de alta de clientes; propuesta solo para desarrollo); `001–010` permanecen como historia del manifiesto. No hay upgrade/backfill v2.0. Se rechaza un pmo_cusn preexistente sin registro. Migración serializada por advisory lock, PostgreSQL 18.6 verificado, checksum de archivo y huella determinista del catálogo. La segunda aplicación no recrea tablas y detecta drift de columnas, restricciones, funciones, triggers, índices y matriz de roles/permisos; la suite verifica también la actualización incremental real G1 `011–012 -> 013`, preservando un cliente existente. El migrador admite un límite interno versionado para esta prueba; el CLI aplica siempre el manifiesto completo.

Diferencias con el SQL fuente entregado: campos de autenticación propia en usuario; seeds de permisos aprobados; search_path fijo pmo_cusn,pg_catalog en las diez funciones; comentarios de permisos coherentes con esos seeds. Las instrucciones de negocio prevalecen sobre el catálogo vacío descrito en versiones anteriores. No se aplicaron transformaciones de datos ni se tocó pmo.

- Fuente original SHA-256: 3d7346235175374a175670e9d8b1ce07b67b554ae63eba84958c7767bad98678.
- Baseline 011 SHA-256: 1086974ab85ca82c7919dec353a05394b7d97472fc9571341e19ecabd22cc40d.
- Migración 012 SHA-256: 238222263df86f8ecd961e70fa147ccd307b82ae855e5ef597d92480cc0e4e38.
- Huella histórica 012: ffeeb9c707e73c91b840cb68c099f79679aca6639ae0138911d96bbbd646ca50.
- Migración 013 SHA-256: 7f5e655a43571e0a9195f1e127d28597f4f65397a83ea2d0c3f9fd54b6a9c456.
- Huella final 011–013: c6fd5248dcc92b144d471209fe2d27c1776acb052f5d1ed26f972ba5a7fdebde.
- Catálogo final: 53 tablas, 10 funciones, 14 triggers, 9 índices parciales, 99 FKs, 4 roles, 39 permisos y 70 concesiones.

db:models y db:models:check rechazan primero una huella divergente; generan/comparan tanto entidades como Drizzle. No puede aprobarse una base divergente simplemente regenerando archivos.

## Reproducir aceptación backend

La instancia usada es PostgreSQL 18.6 loopback 127.0.0.1:55434, cluster local desechable .tools/pmo-v210-pg. Migrador/fixtures: pmo_test_owner. API: pmo_test_runtime_v210. Base de aceptación de recursos independientes: pmo_test_v210_clients_acceptance. El testigo pmo.sentinel conserva value=intacto. La suite nunca elimina bases y exige una base nueva pmo_test_v210_* sin pmo_cusn; no reutilizar el nombre final para repetirla.

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
| G1 | Detalle/miembros/invitaciones (sin token)/elegibles de workspace, recursos independientes, suplencia por titular reasignado, alta/edición con primera línea base inmutable, portafolio denso paginado, ficha con confidencialidad y cota BIGINT | g1-portfolio-http, schema-invariants, access-contracts |

En el cierre histórico anterior a recursos independientes, todos los casos anteriores y los scripts adicionales auth-http/auth-negative/recovery-http/projection/tcp-smoke terminaron con exit 0. TCP histórico: PID 24676, puerto 49403, proceso terminado al cerrar la prueba. typecheck:api, build:api y 8 pruebas puras de dominio pasaron; las pruebas puras heredadas de dominios aplazados no declaran esos servicios funcionales. pnpm audit completo: sin vulnerabilidades conocidas; audit signatures: 617 firmas verificadas tras corregir seis avisos del tooling de desarrollo. Overrides exactos: glob 13.0.6→14.0.2, minimatch 10.2.6→11.0.1 y fast-uri 3.1.8→3.1.9. Se revisaron fuentes, licencias, integridad, scripts, motores y antigüedad; no se habilitaron scripts nuevos ni excepciones de confianza/antigüedad. Storybook compiló; React Doctor en worktree limpio terminó con 0 errores y 31 advertencias preexistentes. No se modificaron componentes frontend.

Fallos corregidos durante el cierre: conteo T05 consultaba TVT sin normalizar; bloqueo FOR SHARE del catálogo rol exigía privilegio indebido y se limitó a usuario/asignación; errores SQL genéricos ya no se presentan como indisponibilidad de conexión; se añadió diagnóstico sanitizado al smoke TCP tras un fallo intermedio no reproducido en la ejecución final.

La aceptación de recursos independientes ejecuta nuevamente T01–T20, G1, auth, contratos, proyección Drizzle y TCP. client-resources-http comprueba búsqueda literal, paginación numérica/BIGINT, duplicados permitidos, validación estricta, permiso independiente, listados activos de más de 100 países/LOB, 404 retirados, INSERT exclusivo y auditoría. tcp-smoke crea un cliente por TCP, lo busca y crea/consulta un proyecto que lo referencia; comprueba esa FK en PostgreSQL. Se corrigieron el orden por alias textual de ID, la validación BigInt de entradas no numéricas y el detalle de denegación doblemente serializado: Bun SQL recibe ahora el objeto JSON directamente. Los artefactos locales conservan códigos de salida por script; esta iteración no ejecuta auditorías de paquetes, Docker, frontend ni despliegues y no modifica el lockfile.

CI mantiene separado el job backend: typecheck, dominio, suite completa con rol runtime, comparación de modelos/OpenAPI, build backend e imagen. No se desactivaron gates frontend preexistentes; no son requisitos del cierre backend local. Consultar el resultado remoto del commit publicado antes de afirmar CI verde. Docker daemon local no estuvo accesible; la imagen local no queda acreditada por las pruebas TCP. CodeGraph no tenía índice, por lo que no condicionó las pruebas.

Referencias contrastadas: [Hono testing](https://hono.dev/docs/guides/testing), [Zod JSON Schema](https://zod.dev/json-schema), [Bun SQL](https://bun.com/docs/runtime/sql), [Drizzle Bun SQL](https://orm.drizzle.team/docs/connect-bun-sql), [PostgreSQL 18 privilegios](https://www.postgresql.org/docs/18/ddl-priv.html), [OWASP contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). La guía Drizzle pública muestra paquetes RC actuales; se conservó 0.45.4 y su API comprobada con consultas/mutaciones reales, sin cambiar a RC ni Drizzle Kit.


## Rectificación del propietario: backend Flujo 1.1

Prevalece sobre propuestas históricas BR-CC-063/BR-FIN-043: el TCV contractual inicial es único e inmutable para siempre. Los CC solo pueden revisar fecha de término mediante aprobación Head en un dominio posterior; quedan sin efecto propuestas de hito CAMBIO o inyección/incremento de TCV. No se implementa P3 aquí. Se mantienen D-03, D-05, D-08, D-11 y D-14: CPI nulo/SIN_HITOS_EXIGIBLES, riesgo 1–4, complejidad Medio 2.6–3.7 y una sola fecha real oficial de cierre sin periodo_cierre_mes.

Cliente Nuevo/Antiguo es clasificación manual obligatoria en alta: estadoCliente NUEVO/ANTIGUO corresponde a cliente.estado_cliente; históricos sin clasificación permanecen null, sin backfill ni inferencia. clientes.crear permanece propuesta de desarrollo pendiente de ratificación productiva.

POST /api/v1/proyectos evoluciona a alta completa: fechaInicio y fechaTerminoBaseline obligatorias (fechas civiles), condicionComercial {tcvTipo:DEFINIDO|ILIMITADO,tcvValor:string|null,unidadCodigo:string|null}; DEFINIDO exige monto decimal no negativo y unidad existente; ILIMITADO exige monto null. especialistaIds opcional contiene usuarios internos activos ESPECIALISTA miembros del workspace, sin duplicados ni autoridad PM adicional. PM se autoasigna; Head elige titular elegible. Condición y participantes se insertan atómicamente; no se genera seguimiento/SPI. La respuesta usa ficha persistida.

POST /api/v1/proyectos/:id/inicio {version:string} es la única orden implementada de arranque: Head o titular/suplente con proyectos.editar; lock, estado Requiere P1P2 y contrato/fechas completos. Devuelve conflicto 409 ante orden repetida/versión obsoleta. El servidor sella fecha_inicio_real civil America/Santiago y evento/auditoría UTC en la misma TX. Inicio planificado, término original y TCV quedan congelados; término actual no se cambia desde ficha. No hay fecha real de cierre ni período redundante.

Migración incremental 014_flujo11_arranque.sql conserva 011–013 y agrega guardas SQL. CHECK de clasificación NOT VALID conserva históricos sin backfill; el trigger exige clasificación en todo INSERT nuevo. La regularización de clientes históricos queda para decisión posterior, sin endpoint de edición inventado.

El contrato frontend deberá incorporar selección/alta clasificada de cliente, condición contractual, fechas, especialistas opcionales y acción de inicio con versión. Esta implementación no acredita el Flujo 1.1 del producto: React y navegador quedan pendientes en otra iteración. Aceptación backend verificada mediante suite Hono/SQL y TCP local; la integración React continúa pendiente.


Evidencia Flujo 1.1: PostgreSQL 18.6 aislado, base pmo_test_v210_flow11_verified en 127.0.0.1:55434, runtime pmo_test_runtime_v210 separado del migrador. Suite: .tools/flow11-suite.log y .tools/backend-v210-evidence/results.json (ignorados). 014 SHA-256: eeef8cf82dc0cfcde35bd5d2f30442f3b6f28257870606d14cda99766cbd0f26; catálogo: 5f0e9de98c74cc067dc4a65d8757d3a2f446adb80267d962d59fad068ced3b04. Modelos: 53 tablas, 14 funciones, 18 triggers. Una CHECK de clasificación queda NOT VALID de forma deliberada para históricos; las nuevas inserciones deben pasar la guarda y la CHECK. El runtime agrega INSERT de condicion_comercial, sin UPDATE/DELETE. Históricos incompletos siguen consultables y no pueden arrancar hasta contar con datos mínimos; la regularización requiere política posterior.

Fuentes históricas: el informe de flujos no está en el repositorio; se consultó la copia real Downloads/informe_flujos_funcionales_y_operativos_pmo.md. El archivo especificacion_logica_y_politicas_negocio_backend_bun.md no se encontró en las rutas inspeccionadas; se emplea el inventario versionado como referencia trazable, subordinado al encargo actual. Ninguna regla antigua de aumento de TCV prevalece.


## Facturación manual del proyecto y viabilidad Drive (corte backend)

TCV y unidad contractual permanecen inmutables. Showprice es referencia comercial; planificado es proyección; realReportado es información del gestor, NO conciliación SAP/ERP ni confirmación de cobro. No se exige igualar suma de hitos y TCV. No hay FX ni suma entre monedas, ni CC económico/hito CAMBIO, ni márgenes, cuotas masivas o arrastre recurrente automático. Estas reglas sustituyen las propuestas históricas incompatibles BR-FIN-043/BR-CC-063; esas propuestas no son backlog implementable.

| Método/ruta | Entrada y respuesta bajo {data} | Acceso/errores |
|---|---|---|
| GET /api/v1/proyectos/:id/facturacion | desde/hasta YYYY-MM (defecto enero–diciembre del año UTC actual), limit 1–100 (50), after ID exclusivo. {proyectoId,contrato,ventana,hitos,paginacion,porMes,totales,estado,notaReal}. IDs y montos strings. totales/porMes cubren toda la ventana, independientemente de la página. | Interno, proyectos.consultar y facturacion.reportar contextuales; Head/titular/suplente efectivo. Ventana máxima 60 meses; más de 10000 filas requiere acotar (422), nunca truncamiento silencioso. |
| GET /api/v1/proyectos/:id/facturacion/indicadores | corte YYYY-MM obligatorio, inclusivo. {proyectoId,corte,estado,porMoneda:[{unidadCodigo,valor,estado}]}. | Mismo alcance financiero. Sin exigibles: null/SIN_HITOS_EXIGIBLES; colección vacía si no hay monedas. Con exigibles y base cero: null/BASE_CERO_PENDIENTE_POLITICA. Históricos incompletos: null/DATOS_INCOMPLETOS. |
| POST /api/v1/proyectos/:id/facturacion/hitos | {claveRegistro:UUID,periodo:YYYY-MM,unidadCodigo,tipoHito:Proyecto|Operación,tipoCuota:SetUp|Recurrente,showprice,planificado,realReportado,comentario:string|null}. Montos no negativos, hasta 16 enteros/4 decimales; moneda existente, incluida UF. 201 con hito persistido. | facturacion.reportar contextual + consulta interna. claveRegistro única por proyecto: reintento idéntico 201 con mismo ID, contenido diferente 409. No inferir cuotas nuevas. |
| PATCH /api/v1/proyectos/:id/facturacion/hitos/:hitoId | Reemplaza los mismos campos editables + version string. Requiere conservar claveRegistro; respuesta con versión incrementada. | Lock de proyecto/hito, reautorización y versión: conflicto 409. Hito de otro proyecto: 404. Solo MANUAL; sin endpoint DELETE. |

Todos los endpoints conservan cookies HttpOnly, Origin/CSRF, validación Zod estricta, sobre de errores uniforme y auditoría. Lectura financiera no se deriva de la lectura global del portafolio: PM ajeno/observador, especialista, visualizador y externo reciben 403. No se habilitan permisos corporativos nuevos. Suplente solo con facturacion.reportar delegado, vigente y revocable. Auditoría incluye actor real y delegación. El runtime suma solo INSERT/UPDATE de hito_facturacion; no DELETE, ni cambios contractuales.

Migración 015_facturacion_manual.sql agrega clave_registro UUID, version y protección de identidad/origen manual sin tocar 011–014. Los registros históricos no se transforman ni se crean muestras en runtime. Montos desconocidos en agregados siguen null; los vacíos devuelven hitos=[], porMes=[], totales=[], estado=SIN_HITOS. CPI es una razón interna reportado/planificado por moneda, no EVM PMI. Los indicadores consultan hasta 10000 filas del proyecto y rechazan exceso de manera explícita; el escalado posterior requiere agregación SQL adicional.

Drive B0 real: EXITO, 2026-11-06T11:46:05.189Z, Mi unidad (sin driveId), canAddChildren=true, creación HTTP 200; carpeta de ensayo 19DV0oLxlt_dawfCfOsSv4CdZJUzDU6p9 y padre verificado mediante files.get. No se borró. No equivale a disponibilidad/cuota futura ni acceso de usuarios. SDK oficial googleapis 188.0.0, fijado por compatibilidad Node22 y antigüedad de publicación; cambios exclusivos de dependencia en package.json/lockfile, sin scripts de instalación nuevos.

Reproducir B0 SOLO con autorización de una nueva carpeta: GOOGLE_APPLICATION_CREDENTIALS=ruta-local-segura (o DRIVE_SA como ruta), DRIVE_ROOT_FOLDER_ID configurado y bun app/api/scripts/drive-smoke.mjs --allow-create-folder. No repetir la escritura para comprobar un resultado ya registrado. Sin reintento automático de creación: ante timeout incierto reconciliar manualmente antes de otra orden. Resultado sanitizado en .tools/drive-b0/result.json; nunca registrar credenciales ni el error SDK completo. credentials*.json permanece ignorado.

El propietario aportó C:/Users/Pedro Lopevia/Documentos/Definiciones PMO.docx y se levantó el bloqueo documental de B1. El provisionador MVP y su endpoint se describen en la sección B1 siguiente; B0 por sí solo sigue sin acreditar proyectos provisionados. No se cambiaron raíz productiva, IAM, DWD u OAuth.

Contrato futuro Frontend: Tab Facturación consume la ventana/cursor y los tres importes por moneda, muestra vacío real y etiquetas Reportado por gestor; presenta CPI null con su estado sin semáforo inventado. Genera/retiene claveRegistro antes de enviar un alta y la reutiliza al reintentar; PATCH usa versión canónica devuelta. 401 restaura/inicia sesión, 403 presenta falta de permiso, 409 obliga reconsulta o resolución de conflicto, 422 corrige entrada. El contrato Drive de proyectos está documentado en la sección B1 siguiente. React y navegador permanecen fuera de esta validación backend.

Referencias contrastadas: https://developers.google.com/workspace/drive/api/guides/folder, https://developers.google.com/workspace/drive/api/guides/handle-errors, https://github.com/googleapis/google-api-nodejs-client y https://www.postgresql.org/docs/18/datatype-numeric.html. Fuentes históricas consultadas en Downloads: informe_consolidado_facturacion_proyecto.md, especificacion_logica_y_politicas_negocio_backend_bun.md e informe_flujos_funcionales_y_operativos_pmo.md; no se confunden con políticas actuales.


Verificación final de este corte: base aislada pmo_test_v210_billing_verified (PostgreSQL 18.6, loopback55434), Bun1.4.4 y runtime pmo_test_runtime_v210. Migración015 SHA-256 043383d4db332801b5916050c43eace53e02c8f1bc1910a945136074bcc2f3ab; catálogo 36b0b3451651b16a43dc92d181d36c85e7d260acbcea0149c4553ff9a7130886. Instalación/upgrade011–014→015, repetición y drift pasaron; pmo.sentinel intacto. test:db terminó21 scripts exit0; test:domain12 PASS; typecheck:api, db:models:check, api:openapi:check, build:api y diff--check exit0. TCP final PID19836/puerto53570 terminó al finalizar; instancia de ensayo detenida. Evidencia local ignorada .tools/billing-suite.log y .tools/backend-v210-evidence/results.json. pnpm frozen install exit0, audit sin vulnerabilidades conocidas, 694 firmas verificadas; ninguna dependencia anterior eliminada (343 líneas adicionales del lockfile para SDK/transitivos).

Incidente Git revalidado: .git es directorio, no hay index.lock. Con los permisos actuales git add --dry-run de un archivo backend terminó0; el bloqueo anterior no se reproduce, no se alteraron ACL ni controles. Índice vacío; no se hicieron commits ni pushes en este corte, cuyo B1 se continuó al recibir la ruta documental correcta. HEAD sigue e3fc7197f04d057e421ebe2fe3eb913aa42e4f59 en dev-tvt-foundry.


## Drive B1: provisionamiento documental recuperable

Fuente exacta aportada por propietario: C:/Users/Pedro Lopevia/Documentos/Definiciones PMO.docx. SHA-256 5b0a4779d5d9cd5d1e8226eb58a42f5b954563e8c1b6d052d9811b694d3c6d9c. Se extrajeron los párrafos numerados de FORMATO DE CARPETAS: 83 nodos bajo raíz, cinco etapas (INICIO, PLANIFICACIÓN, Ejecución, Monitoreo y Control, Cierre), hasta cuatro niveles. app/api/src/application/drive/tree.json conserva nombres y jerarquía, claves estables por posición y versión ligada al hash fuente. La raíz de cada proyecto es NOMBRE CLIENTE – NOMBRE PROYECTO (valores reales, sin forzar mayúsculas). Son 84 carpetas contando esa raíz.

Observaciones de la fuente, conservadas sin corregir: «Pan de Gestión de Adquisiciones», «Gestióon de Crisis», «Cargda de CMDB» y «Cargda de localidades». RASCA/ODT y la mezcla de mayúsculas se conservan; no se infieren correcciones ni se copian templates/documentos. El archivo fuente permanece intacto.

016_drive_provisionamiento.sql agrega drive_provisionamiento y drive_carpeta. Intención durable y snapshots de nombre/raíz/version se insertan en la misma TX del proyecto únicamente si DRIVE_PROVISIONING_ENABLED=true; por defecto false. Ninguna llamada Drive ocurre dentro del alta ni retiene locks SQL durante llamadas remotas. El proyecto no se revierte por un fallo remoto. proyecto.drive_folder_id apunta a la raíz verificada; un estado ERROR puede coexistir con carpetas parciales.

Ejecutor controlado (una tarea por invocación, sin daemon fire-and-forget): con DATABASE_URL del rol runtime, JWT_SIGNING_KEY de configuración API, DRIVE_PROVISIONING_ENABLED=true y GOOGLE_APPLICATION_CREDENTIALS apuntando al archivo SA local (alternativa DRIVE_SA como ruta), ejecutar `node scripts/run-bun.mjs run app/api/scripts/drive-worker.ts`. Selecciona un pendiente, error transitorio cuyo plazo venció o claim expirado. Puede programarse por el operador; no se instaló servicio/scheduler ni se desplegó. Deshabilitar el flag detiene nuevas intenciones y el ejecutor; conserva el estado existente. No modificar el flag en producción sin proceso operativo aprobado.

Para revalidar un proyecto concreto: mismo comando con --project=ID. Para recuperación manual de ERROR permanente: --project=ID --retry-error, tras resolver la causa. Un claim concurrente vigente retorna SIN_CLAIM. Lease de diez minutos renovado por nodo; expirado es recuperable y los updates están cercados por token. Las transacciones son cortas y locales. El adaptador oficial googleapis mantiene supportsAllDrives, pagina búsquedas y solicita solo metadata. Reads transitorios se reintentan tres intentos totales con backoff/jitter acotado; cada creación se envía una sola vez y una respuesta incierta se reconcilia antes de reintentar.

Idempotencia local: PK(proyecto_id,clave_nodo), Drive ID único y una identidad UUID de intención independiente del ID de BD para evitar colisiones entre entornos. appProperties pmoJob/pmoNode y parent/type permiten reconciliar carpetas creadas antes de perder respuesta o proceso. No se buscan coincidencias solo por nombre. Más de una coincidencia remota o cambio de nombre/padre/tipo produce ERROR, sin borrar ni mover archivos. Los errores guardan solo códigos seguros. Transitorios: hasta cinco intentos de trabajo, con backoff exponencial hasta una hora; permisos/cuota/autenticación requieren intervención explícita. No se promete exactamente una vez bajo visibilidad eventual o anomalías externas. Segunda invocación serial se prueba sin duplicados observados.

GET /api/v1/proyectos/:id/drive/carpetas devuelve {data:{proyectoId,estado,intentos,errorCodigo,updatedAt,carpetas:[{clave,driveId,parentDriveId,ruta,checkedAt,errorCodigo,webViewLink}],nota}}. Estados persistidos PENDIENTE/EN_PROCESO/COMPLETADO/ERROR; NO_SOLICITADO representa ausencia real de intención. Consulta interna limitada a Head o titular/suplente con proyectos.consultar y proyectos.editar contextuales. No hay endpoint público para crear trabajos ni acceso por un ID Drive arbitrario. Los enlaces/metadatos no verifican contenido ni ACL del usuario. COMPLETADO se sella solo tras verificar los 84 nodos esperados; la segunda invocación revalida los IDs.

Pruebas separadas: tests/drive-http.ts usa PostgreSQL real con adaptador falso para fallos/concurrencia/recuperación y HTTP autorizado; no acredita Google. tests/unit/drive.test.ts comprueba jerarquía, nombres y clasificación segura de errores. tests/drive-e2e.ts es opt-in: NODE_ENV=test, TEST_DATABASE_URL owner de base local pmo_test_v210_*, DATABASE_URL runtime de esa misma base, JWT_SIGNING_KEY/APP_ORIGINS/COOKIE_SECURE locales y ruta SA, ejecutar con --allow-test-tree. Usa exclusivamente el testId exitoso de .tools/drive-b0/result.json como padre del ensayo, verificando que pertenece a la raíz configurada. Crea un proyecto sintético vía API; verifica padres/nombres/IDs/appProperties y búsquedas sin duplicados; repite el provisionamiento con cero creaciones nuevas. No forma parte de CI por defecto ni usa proyectos corporativos. Evidencia local .tools/drive-b1/result.json; permite retomar el mismo proyecto de ensayo en esa BD si la ejecución se interrumpe.


Resultado B1 verificado (2026-11-06): documento disponible y bloqueo levantado. Migración016 SHA-256 b2bbe3bbf337c012c74db6647bdf461518c19ff75eed13a2c3494c191ef941e8; catálogo 51931dc9f7790e9a9e51e51209dbd7a220437b7346a27a4e754901b614d3115e. Baseline011–015 inmutable. Catálogo ampliado a55 tablas, con modelo y proyección Drizzle regenerados. Upgrade011–015→016, segunda aplicación y pruebas de drift pasaron con pmo.sentinel intacto.

E2E real en pmo_test_v210_drive_suite1, proyecto sintético26: estado COMPLETADO,84 carpetas creadas/verificadas (raíz+83), raíz14kkM7gq_ghk_uR7hCQ3Z6giAS_IfIxW_ dentro del testB0 19DV0oLxlt_dawfCfOsSv4CdZJUzDU6p9. Las84 búsquedas por padre/tipo/appProperties devolvieron una sola coincidencia; reejecución serial creó0 carpetas y mantuvo todos los IDs. Las carpetas quedan para limpieza manual autorizada, no se borraron. Evidencia .tools/drive-b1/result.json y .tools/drive-b1-e2e.log. El resultado prueba este ensayo, sin prometer exactamente una vez frente a anomalías externas ni validar contenido o ACL humanas.

Regresión final en pmo_test_v210_drive_verified:22 scripts exit0 (F1–F7, G1, Flujo1.1, Facturación, Drive HTTP/SQL con adaptador falso, TCP real, modelos y OpenAPI).15 tests de dominio PASS. typecheck:api, build:api, db:models:check, api:openapi:check y git diff --check exit0. TCP PID14412/puerto46221 terminó al cerrar. Drive externo es opt-in y no está incluido en esos22 scripts; su E2E real se ejecutó aparte con --allow-test-tree. No se modificó frontend ni dependencias en esta continuación; googleapis188.0.0 ya estaba fijado en el corte anterior. Flag desactivado por defecto y ningún ejecutor/scheduler productivo instalado.
