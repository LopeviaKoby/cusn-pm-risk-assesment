ALTER TABLE pmo_cusn.control_cambio
  ADD COLUMN aprobador_economico_id bigint REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT,
  ADD COLUMN fecha_aprobacion_economica timestamptz,
  ADD CONSTRAINT ck_cc_aprobacion_economica CHECK (
    estado_aprobacion IS DISTINCT FROM 'APROBADO'
    OR (aprobador_economico_id IS NOT NULL AND fecha_aprobacion_economica IS NOT NULL)
  );

-- Un CC consumido para fecha conserva inmutables sus datos sustantivos, pero su
-- aprobación económica independiente puede registrarse posteriormente.
CREATE OR REPLACE FUNCTION pmo_cusn.proteger_control_cambio_consumido() RETURNS trigger
LANGUAGE plpgsql SET search_path = pmo_cusn, pg_catalog AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pmo_cusn.solicitud_cambio_planificacion s
             WHERE s.control_cambio_id=OLD.id AND s.estado='APROBADO') THEN
    IF TG_OP='DELETE' THEN RAISE EXCEPTION 'No se permite eliminar un control de cambio consumido: %', OLD.id; END IF;
    IF (to_jsonb(NEW) - 'estado_aprobacion' - 'aprobador_economico_id' - 'fecha_aprobacion_economica')
       IS DISTINCT FROM
       (to_jsonb(OLD) - 'estado_aprobacion' - 'aprobador_economico_id' - 'fecha_aprobacion_economica') THEN
      RAISE EXCEPTION 'No se permite modificar un control de cambio consumido: %', OLD.id;
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
