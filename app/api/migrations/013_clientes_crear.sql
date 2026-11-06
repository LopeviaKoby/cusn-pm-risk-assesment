-- G1: propuesta nueva del propietario autorizada solo para desarrollo.
-- Activación en producción pendiente de ratificación explícita. No implica CRUD de maestros.
INSERT INTO pmo_cusn.permiso(codigo,descripcion,delegable)
VALUES ('clientes.crear','Registrar cliente (propuesta G1; producción requiere ratificación)',false);

INSERT INTO pmo_cusn.rol_permiso(rol_id,permiso_id)
SELECT r.id,p.id FROM pmo_cusn.rol r CROSS JOIN pmo_cusn.permiso p
WHERE r.codigo IN ('ADMIN','PM') AND p.codigo='clientes.crear';
