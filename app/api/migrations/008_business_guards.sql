-- La matriz rol_permiso permanece vacía; no se infieren facultades por rol.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pmo_cusn.asignacion_rol a JOIN pmo_cusn.rol r ON r.id=a.rol_id WHERE r.codigo='COORDINADOR')
     OR EXISTS (SELECT 1 FROM pmo_cusn.rol_permiso rp JOIN pmo_cusn.rol r ON r.id=rp.rol_id WHERE r.codigo='COORDINADOR')
  THEN RAISE EXCEPTION 'COORDINADOR tiene referencias; reconciliar sin reasignación automática'; END IF;
END $$;
DELETE FROM pmo_cusn.rol WHERE codigo='COORDINADOR';

CREATE UNIQUE INDEX uq_hito_aporte_control_cambio ON pmo_cusn.hito_facturacion(control_cambio_id)
  WHERE control_cambio_id IS NOT NULL;

CREATE FUNCTION pmo_cusn.proteger_baseline_y_cierre() RETURNS trigger
LANGUAGE plpgsql SET search_path = pmo_cusn, pg_catalog AS $$
BEGIN
  IF OLD.fecha_termino_baseline IS NOT NULL
     AND NEW.fecha_termino_baseline IS DISTINCT FROM OLD.fecha_termino_baseline THEN
    RAISE EXCEPTION 'La primera línea base de término es inmutable';
  END IF;
  IF OLD.estado_actual IN ('Cerrado exitoso','Cerrado con observaciones')
     AND NEW.estado_actual = OLD.estado_actual
     AND (NEW.fecha_cierre_real IS DISTINCT FROM OLD.fecha_cierre_real
          OR NEW.periodo_cierre_mes IS DISTINCT FROM OLD.periodo_cierre_mes) THEN
    RAISE EXCEPTION 'La fecha de cierre vigente es inmutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tr_proteger_baseline_y_cierre BEFORE UPDATE ON pmo_cusn.proyecto
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.proteger_baseline_y_cierre();

CREATE FUNCTION pmo_cusn.impedir_mutacion_seguimiento() RETURNS trigger
LANGUAGE plpgsql SET search_path = pmo_cusn, pg_catalog AS $$
BEGIN RAISE EXCEPTION 'El seguimiento es append-only'; END $$;
CREATE TRIGGER tr_seguimiento_inmutable BEFORE UPDATE OR DELETE ON pmo_cusn.seguimiento_proyecto
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.impedir_mutacion_seguimiento();

CREATE FUNCTION pmo_cusn.proteger_economia_cc_aprobado() RETURNS trigger
LANGUAGE plpgsql SET search_path = pmo_cusn, pg_catalog AS $$
BEGIN
  IF OLD.estado_aprobacion = 'APROBADO' AND (
    NEW.estado_aprobacion IS DISTINCT FROM OLD.estado_aprobacion OR
    NEW.impacto_monetario IS DISTINCT FROM OLD.impacto_monetario OR
    NEW.tipo_impacto IS DISTINCT FROM OLD.tipo_impacto OR
    NEW.unidad_codigo IS DISTINCT FROM OLD.unidad_codigo OR
    NEW.proyecto_id IS DISTINCT FROM OLD.proyecto_id
  ) THEN RAISE EXCEPTION 'La economía de un CC aprobado es inmutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tr_cc_economia_aprobada BEFORE UPDATE ON pmo_cusn.control_cambio
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.proteger_economia_cc_aprobado();
