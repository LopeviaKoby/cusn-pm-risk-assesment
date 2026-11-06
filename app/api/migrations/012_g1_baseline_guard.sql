-- G1 / P0-Base: inmutabilidad de la primera línea base de término y coherencia de fecha actual.
-- Adaptado al baseline v2.1.0 (011); no incluye columnas de cierre pendientes de D-14.
SELECT set_config('search_path', 'pmo_cusn,pg_catalog', true);

ALTER TABLE pmo_cusn.proyecto
  ADD CONSTRAINT ck_proyecto_fecha_termino_actual CHECK (
    fecha_inicio IS NULL OR fecha_termino_actual IS NULL
    OR fecha_termino_actual >= fecha_inicio
  );

CREATE FUNCTION pmo_cusn.proteger_baseline_termino() RETURNS trigger
LANGUAGE plpgsql SET search_path = pmo_cusn, pg_catalog AS $$
BEGIN
  IF OLD.fecha_termino_baseline IS NOT NULL
     AND NEW.fecha_termino_baseline IS DISTINCT FROM OLD.fecha_termino_baseline THEN
    RAISE EXCEPTION 'La primera línea base de término es inmutable';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tr_proteger_baseline_termino
  BEFORE UPDATE ON pmo_cusn.proyecto
  FOR EACH ROW EXECUTE FUNCTION pmo_cusn.proteger_baseline_termino();
