CREATE TABLE pmo_cusn.drive_provisionamiento (
 proyecto_id bigint PRIMARY KEY REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT,
 estado text NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE','EN_PROCESO','COMPLETADO','ERROR')),
 remote_key uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(), root_parent_id text NOT NULL, root_name text NOT NULL CHECK(btrim(root_name)<>''), tree_version text NOT NULL,
 intentos integer NOT NULL DEFAULT 0 CHECK(intentos>=0), claim_token uuid, lease_until timestamptz,
 next_attempt_at timestamptz, error_codigo text, created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((estado='EN_PROCESO')=(claim_token IS NOT NULL AND lease_until IS NOT NULL))
);
CREATE TABLE pmo_cusn.drive_carpeta (
 proyecto_id bigint NOT NULL REFERENCES pmo_cusn.drive_provisionamiento(proyecto_id) ON DELETE RESTRICT,
 clave_nodo text NOT NULL, drive_id text NOT NULL UNIQUE, parent_drive_id text NOT NULL, ruta text NOT NULL,
 checked_at timestamptz NOT NULL DEFAULT now(), error_codigo text,
 PRIMARY KEY(proyecto_id,clave_nodo)
);
CREATE INDEX ix_drive_trabajos ON pmo_cusn.drive_provisionamiento(estado,next_attempt_at);