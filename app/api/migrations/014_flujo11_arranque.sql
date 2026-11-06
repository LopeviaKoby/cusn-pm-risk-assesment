ALTER TABLE pmo_cusn.proyecto ADD COLUMN fecha_inicio_real date;
ALTER TABLE pmo_cusn.cliente ADD CONSTRAINT ck_cliente_clasificacion CHECK (estado_cliente IS NULL OR estado_cliente IN ('NUEVO','ANTIGUO')) NOT VALID;
CREATE FUNCTION pmo_cusn.guardar_clasificacion_cliente() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pmo_cusn AS $$
BEGIN
 IF NEW.estado_cliente IS NULL OR NEW.estado_cliente NOT IN ('NUEVO','ANTIGUO') THEN RAISE EXCEPTION 'Clasificacion manual requerida' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER tr_cliente_clasificacion BEFORE INSERT ON pmo_cusn.cliente FOR EACH ROW EXECUTE FUNCTION pmo_cusn.guardar_clasificacion_cliente();
CREATE FUNCTION pmo_cusn.guardar_contrato() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pmo_cusn AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Contrato inmutable'; END IF;
 IF (NEW.proyecto_id,NEW.tcv_tipo,NEW.tcv_valor,NEW.unidad_codigo) IS DISTINCT FROM (OLD.proyecto_id,OLD.tcv_tipo,OLD.tcv_valor,OLD.unidad_codigo) THEN RAISE EXCEPTION 'Contrato inmutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER tr_contrato_inmutable BEFORE UPDATE OR DELETE ON pmo_cusn.condicion_comercial FOR EACH ROW EXECUTE FUNCTION pmo_cusn.guardar_contrato();
CREATE FUNCTION pmo_cusn.guardar_arranque() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pmo_cusn AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.fecha_inicio_real IS NOT NULL THEN RAISE EXCEPTION 'Inicio real solo por arranque'; END IF;
 ELSE
  IF NEW.fecha_inicio IS DISTINCT FROM OLD.fecha_inicio OR NEW.fecha_termino_actual IS DISTINCT FROM OLD.fecha_termino_actual THEN RAISE EXCEPTION 'Planificacion congelada; cambio de termino requiere dominio CC aprobado'; END IF;
  IF OLD.fecha_inicio_real IS NOT NULL AND NEW.fecha_inicio_real IS DISTINCT FROM OLD.fecha_inicio_real THEN RAISE EXCEPTION 'Inicio real inmutable'; END IF;
  IF NEW.fecha_inicio_real IS DISTINCT FROM OLD.fecha_inicio_real OR (NEW.estado_actual='En ejecución' AND OLD.estado_actual IS DISTINCT FROM NEW.estado_actual) THEN
   IF OLD.estado_actual<>'Requiere P1P2' OR OLD.fecha_inicio_real IS NOT NULL OR NEW.estado_actual<>'En ejecución' OR NEW.fecha_inicio_real IS DISTINCT FROM (transaction_timestamp() AT TIME ZONE 'America/Santiago')::date THEN RAISE EXCEPTION 'Arranque invalido'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER tr_arranque_guard BEFORE INSERT OR UPDATE ON pmo_cusn.proyecto FOR EACH ROW EXECUTE FUNCTION pmo_cusn.guardar_arranque();
CREATE FUNCTION pmo_cusn.validar_evento_arranque() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pmo_cusn AS $$
BEGIN
 IF NEW.fecha_inicio_real IS DISTINCT FROM OLD.fecha_inicio_real THEN
  IF NOT EXISTS(SELECT 1 FROM pmo_cusn.evento_proyecto e WHERE e.proyecto_id=NEW.id AND e.tipo_evento='INICIO_EJECUCION' AND e.estado_nuevo='En ejecución' AND e.fecha_evento=transaction_timestamp()) THEN RAISE EXCEPTION 'Arranque requiere evento atomico'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER tr_arranque_evento AFTER UPDATE ON pmo_cusn.proyecto DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION pmo_cusn.validar_evento_arranque();
