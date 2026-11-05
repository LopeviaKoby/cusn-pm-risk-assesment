-- PL/pgSQL resuelve tablas al invocarse; no depender de SET LOCAL del DDL.
ALTER FUNCTION pmo_cusn.validar_control_cambio_para_solicitud() SET search_path = pmo_cusn, pg_catalog;
ALTER FUNCTION pmo_cusn.impedir_mutacion_solicitud_resuelta() SET search_path = pmo_cusn, pg_catalog;
ALTER FUNCTION pmo_cusn.proteger_control_cambio_consumido() SET search_path = pmo_cusn, pg_catalog;
ALTER FUNCTION pmo_cusn.impedir_mutacion_evento_proyecto() SET search_path = pmo_cusn, pg_catalog;
