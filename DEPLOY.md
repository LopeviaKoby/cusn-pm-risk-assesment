# Despliegue de la base y la aplicación

Este documento es para quien administra la infraestructura. El repositorio **no incluye una base de datos en ejecución**: incluye el esquema SQL, las herramientas para crearlo y el paquete Docker para levantar la aplicación.

```text
Navegador → web (NGINX, único puerto publicado) → /api → api (Bun) → db (PostgreSQL)
```

El usuario final nunca recibe credenciales de PostgreSQL. La API usa el rol `pmo_app`; las migraciones usan el rol propietario. La base y la API no publican puertos al host.

## Qué trae el repositorio

| Archivo | Función |
|---|---|
| `compose.yaml` | Servicios `db`, `migrate`, `bootstrap`, `verify`, `api` y `web`. |
| `server/Dockerfile` | Imagen de la API Bun 1.4.4, sin secretos. |
| `Dockerfile` | Imagen del frontend; con `APP_MODE=api` compila el modo conectado. |
| `nginx.conf` | Sirve el frontend y hace proxy de `/api/` hacia `api:3001`. |
| `server/migrations/001_schema.sql` | 24 tablas del esquema `pmo`. |
| `server/migrations/004_units.sql` | 9 unidades monetarias requeridas por las FK. |
| `server/migrations/002_seed_catalogos.sql` | Catálogos de demostración (solo modo demo). |
| `server/migrations/003_seed_lab.sql` | 8 proyectos sintéticos (solo modo demo). |
| `server/scripts/migrate.ts` | Aplica migraciones con checksum y modo `schema` o `demo`. |
| `server/scripts/bootstrap-db.ts` | Crea/actualiza `pmo_app` y sus permisos DML. |
| `server/scripts/verify-db.ts` | Verifica tablas, unidades, versión, permisos y conteos. |
| `server/scripts/hash-password.ts` | Genera el hash bcrypt para `GPL_PASSWORD_HASH_B64`. |
| `deploy/env.example` | Plantilla de variables; cópiala a `.env`. |

## Antes de empezar

- Docker Engine con Compose v2 (`docker compose version`).
- Un dominio y un proxy TLS delante del puerto `WEB_PORT` (por ejemplo, NGINX, Caddy o Traefik). El contenedor `web` sirve HTTP; no gestiona certificados.
- Acceso a Docker Hub y GHCR para las imágenes fijadas por digest.
- Autorización para los datos que se vayan a cargar. El repositorio solo contiene datos sintéticos.

## Variables

Copia la plantilla y edítala:

```sh
cp deploy/env.example .env
```

`.env` está ignorado por Git y por Docker. No lo subas ni lo compartas.

| Variable | Uso |
|---|---|
| `POSTGRES_DB` | Nombre de la base. Por defecto `pmo`. |
| `POSTGRES_USER` | Rol propietario/migrador. Por defecto `pmo_owner`. |
| `POSTGRES_PASSWORD` | Contraseña del propietario. URL-safe. |
| `APP_DB_ROLE` | Rol de runtime. Por defecto `pmo_app`. |
| `APP_DB_PASSWORD` | Contraseña del runtime. URL-safe, mínimo 12 caracteres. |
| `DB_MIGRATE_MODE` | `schema` (solo estructura) o `demo` (estructura + datos sintéticos). |
| `EXPECT_PROJECTS` | `8` en demo; vacío en producción. |
| `WEB_PORT` | Puerto HTTP publicado. Por defecto `8080`. |
| `APP_ORIGINS` | Origen público exacto, por ejemplo `https://pmo.example.com`. |
| `COOKIE_SECURE` | `true` con HTTPS. `false` solo para pruebas HTTP locales. |
| `GPL_USER` | Usuario de la sesión de laboratorio. |
| `GPL_PASSWORD_HASH_B64` | Hash bcrypt en base64; no es la contraseña. |
| `GPL_AS_OF_DATE` | Fecha de corte que muestra la API. |
| `GPL_SESSION_MINUTES` | Duración de la sesión. |
| `DB_POOL_MAX` | Conexiones del pool de la API. |

**Contraseñas URL-safe:** usa solo letras, números, `-` y `_`; evita `@`, `:`, `/`, `?` y `#`, porque forman parte de la URL de conexión. Puedes generarlas con `openssl rand -hex 24`.

**Hash de la contraseña de acceso:** después de construir la imagen de la API:

```sh
docker compose build api
docker compose run --rm --no-deps api bun run server/scripts/hash-password.ts 'TuClaveLarga'
```

Copia la salida en `GPL_PASSWORD_HASH_B64`. La contraseña en claro no se guarda en el repositorio.

## Despliegue demo (datos sintéticos)

Sirve para validar la infraestructura y mostrar la aplicación con datos. **No es producción.**

1. Edita `.env` y define:
   ```dotenv
   DB_MIGRATE_MODE=demo
   EXPECT_PROJECTS=8
   APP_ORIGINS=https://tu-dominio.example
   COOKIE_SECURE=true
   ```
2. Genera el hash y complétalo (ver arriba).
3. Levanta todo:
   ```sh
   docker compose up -d --build
   ```
4. Comprueba el estado:
   ```sh
   docker compose ps
   docker compose logs migrate bootstrap verify api
   ```
5. Abre `https://tu-dominio.example` (o `http://IP:8080` si aún no hay TLS y `COOKIE_SECURE=false`). Inicia sesión con `GPL_USER` y la contraseña usada para generar el hash.

El servicio `migrate` aplica `001`, `004`, `002` y `003`; `bootstrap` crea `pmo_app`; `verify` comprueba 24 tablas, 9 unidades, la versión `004` y los permisos; después arrancan `api` y `web`.

Para reiniciar la demo desde cero (destruye el volumen y los datos):

```sh
docker compose down -v
docker compose up -d
```

## Despliegue con datos autorizados

1. Edita `.env`:
   ```dotenv
   DB_MIGRATE_MODE=schema
   EXPECT_PROJECTS=
   ```
2. Levanta la infraestructura:
   ```sh
   docker compose up -d --build
   ```
   La base queda con el esquema y las unidades, sin proyectos ni catálogos de demostración.
3. Detén la API y el frontend durante la carga:
   ```sh
   docker compose stop api web
   ```
4. Carga los datos con un proceso autorizado y auditado, fuera de este repositorio. Opciones:
   - ETL revisado que use el rol propietario.
   - `pg_restore` de un dump aprobado.
   - `pnpm run db:import-sample -- "<carpeta>"` **solo en local**. Ese comando trunca las 24 tablas y no debe ejecutarse en infraestructura compartida.
   La carga debe incluir los catálogos (`catalogo_valor`) y los estados (`estado_proyecto`) que use la operación; el esquema solo no los inventa.
5. Si la carga creó tablas o secuencias con otro rol, vuelve a aplicar permisos y verifica:
   ```sh
   docker compose run --rm bootstrap
   docker compose run --rm verify
   ```
6. Vuelve a arrancar la aplicación y comprueba el login y una consulta real:
   ```sh
   docker compose start api web
   ```

No subas CSV, dumps ni datos corporativos al repositorio, a la imagen ni al contexto Docker. La muestra del 20 % usada en local es un artefacto externo y no forma parte del paquete.

## Verificación

```sh
docker compose ps
docker compose logs --tail=100 migrate bootstrap verify api
docker compose run --rm verify
curl -fsS http://127.0.0.1:8080/healthz
curl -fsS http://127.0.0.1:8080/api/v1/salud
curl -fsS http://127.0.0.1:8080/api/v1/listo
```

`/api/v1/listo` debe devolver la base y la versión de migración. `verify` debe terminar con `Verificación correcta.` y mostrar los conteos. En demo, `proyectos=8`.

La autenticación se prueba en el navegador: `POST /api/v1/sesion`, cookie `gpl_session` y acceso a `/api/v1/datos`. No hay usuario de PostgreSQL por persona.

## Operación

```sh
docker compose logs -f api
docker compose restart api
docker compose stop
docker compose down          # conserva el volumen
docker compose down -v       # elimina el volumen y los datos
```

Actualización:

1. Haz una copia de seguridad.
2. `git pull` en la rama acordada.
3. `docker compose build`.
4. `docker compose up -d`. El servicio `migrate` aplica solo migraciones nuevas.

Las migraciones ya aplicadas no se editan: el runner compara checksums y falla si el contenido cambió. Cualquier corrección va en una migración nueva.

### Copia de seguridad

```sh
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > pmo-$(date +%F).dump
```

Restauración consciente (detén la API y el frontend, conserva una copia previa):

```sh
docker compose stop api web
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < pmo-2026-10-30.dump
docker compose run --rm bootstrap
docker compose start api web
```

`--clean` elimina objetos existentes. No lo uses sin copia previa. Tras restaurar, vuelve a aplicar `bootstrap` porque los permisos pueden haberse perdido.

## Seguridad y límites

- Solo `web` publica `WEB_PORT`. `db` y `api` no tienen puertos publicados.
- `db` solo es accesible por la red `pmo`. No expongas `5432`.
- `pmo_app` tiene DML, sin `CREATE` ni DDL. Las migraciones usan el propietario.
- El frontend y la API hablan por `/api`; no hay CORS abierto ni credenciales de base en el navegador.
- Termina TLS en un proxy externo y mantén `COOKIE_SECURE=true`. `APP_ORIGINS` debe coincidir exactamente con el origen público.
- La sesión es de un solo usuario de entorno, en memoria, sin SSO, RBAC, multitenencia ni recuperación de contraseña. **No es autenticación corporativa.**
- Los datos demo son ficticios y sintéticos. Desplegarlos no los convierte en datos de producción.
- Las migraciones demo (`002`, `003`) no se aplican en modo `schema`. No cambies el modo a `demo` en una base con datos reales.

## Problemas comunes

| Síntoma | Revisión |
|---|---|
| `migrate` falla por checksum | No edites migraciones aplicadas; restaura el archivo o crea una migración nueva. |
| `bootstrap` falla por propietario | `MIGRATOR_DATABASE_URL` debe conectar como dueño de `pmo.proyecto`. |
| `api` no arranca | `docker compose logs api`; revisa `DATABASE_URL`, `APP_DB_PASSWORD` y los permisos. |
| `/api` devuelve 502 | La API no está sana o no resuelve `api`; revisa `docker compose ps` y logs. |
| El login no mantiene la sesión | `COOKIE_SECURE=true` exige HTTPS; en HTTP local usa `false` solo para probar. |
| `403 ORIGIN_REJECTED` | `APP_ORIGINS` no coincide con el origen real (esquema, host y puerto). |
| `verify` falla con 23 tablas | Una migración no se aplicó; revisa `docker compose logs migrate`. |
| Se perdió el volumen | `docker compose down -v` lo elimina; restaura el dump. |

## Rollback

1. Vuelve a la imagen anterior (`docker compose` con el tag previo) y arranca.
2. Si el problema es de datos, restaura la copia de seguridad.
3. No borres el volumen ni edites migraciones aplicadas para “arreglar” el estado.

Las migraciones de este repositorio son aditivas; el rollback de esquema se hace con una migración correctiva revisada o restaurando la copia, no con `DROP` improvisado.