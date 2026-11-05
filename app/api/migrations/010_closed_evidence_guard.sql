-- Serializa mutaciones de evidencia con el cierre, que bloquea proyecto primero.
CREATE FUNCTION pmo_cusn.impedir_evidencia_de_proyecto_cerrado() RETURNS trigger
LANGUAGE plpgsql SET search_path = pmo_cusn, pg_catalog AS $$
DECLARE current_project_id bigint; previous_project_id bigint; current_state text;
BEGIN
  IF TG_TABLE_NAME IN ('riesgo_proyecto','item_checklist_proyecto','leccion_aprendida') THEN
    IF TG_OP <> 'INSERT' THEN previous_project_id := OLD.proyecto_id; END IF;
    IF TG_OP <> 'DELETE' THEN current_project_id := NEW.proyecto_id; END IF;
  ELSIF TG_TABLE_NAME = 'item_checklist_documento' THEN
    SELECT i.proyecto_id INTO previous_project_id FROM pmo_cusn.item_checklist_proyecto i
      WHERE i.id = CASE WHEN TG_OP='INSERT' THEN NEW.item_checklist_id ELSE OLD.item_checklist_id END;
    IF TG_OP='UPDATE' THEN
      SELECT i.proyecto_id INTO current_project_id FROM pmo_cusn.item_checklist_proyecto i WHERE i.id=NEW.item_checklist_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'evaluacion_riesgo' THEN
    SELECT r.proyecto_id INTO previous_project_id FROM pmo_cusn.riesgo_proyecto r
      WHERE r.id = CASE WHEN TG_OP='INSERT' THEN NEW.riesgo_proyecto_id ELSE OLD.riesgo_proyecto_id END;
    IF TG_OP='UPDATE' THEN
      SELECT r.proyecto_id INTO current_project_id FROM pmo_cusn.riesgo_proyecto r WHERE r.id=NEW.riesgo_proyecto_id;
    END IF;
  END IF;
  FOR current_project_id IN SELECT DISTINCT x.id FROM unnest(ARRAY[previous_project_id,current_project_id]) x(id) WHERE x.id IS NOT NULL ORDER BY x.id LOOP
    SELECT estado_actual INTO current_state FROM pmo_cusn.proyecto WHERE id=current_project_id FOR UPDATE;
    IF current_state IN ('Cerrado exitoso','Cerrado con observaciones') THEN
      RAISE EXCEPTION 'La evidencia de un proyecto cerrado es inmutable; reabrir antes de editar';
    END IF;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tr_riesgo_proyecto_cerrado BEFORE INSERT OR UPDATE OR DELETE ON pmo_cusn.riesgo_proyecto
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.impedir_evidencia_de_proyecto_cerrado();
CREATE TRIGGER tr_checklist_proyecto_cerrado BEFORE INSERT OR UPDATE OR DELETE ON pmo_cusn.item_checklist_proyecto
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.impedir_evidencia_de_proyecto_cerrado();
CREATE TRIGGER tr_checklist_documento_cerrado BEFORE INSERT OR UPDATE OR DELETE ON pmo_cusn.item_checklist_documento
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.impedir_evidencia_de_proyecto_cerrado();
CREATE TRIGGER tr_leccion_proyecto_cerrado BEFORE INSERT OR UPDATE OR DELETE ON pmo_cusn.leccion_aprendida
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.impedir_evidencia_de_proyecto_cerrado();
CREATE TRIGGER tr_evaluacion_riesgo_cerrado BEFORE INSERT OR UPDATE OR DELETE ON pmo_cusn.evaluacion_riesgo
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.impedir_evidencia_de_proyecto_cerrado();

CREATE FUNCTION pmo_cusn.impedir_archivar_evidencia_de_cierre() RETURNS trigger
LANGUAGE plpgsql SET search_path = pmo_cusn, pg_catalog AS $$
DECLARE project_id bigint; state text;
BEGIN
  IF TG_OP='DELETE' OR (OLD.estado_registro='VIGENTE' AND NEW.estado_registro<>'VIGENTE') THEN
    FOR project_id IN SELECT DISTINCT i.proyecto_id FROM pmo_cusn.item_checklist_documento l
      JOIN pmo_cusn.item_checklist_proyecto i ON i.id=l.item_checklist_id
      WHERE l.documento_id=OLD.id AND i.requiere_documento ORDER BY i.proyecto_id LOOP
      SELECT estado_actual INTO state FROM pmo_cusn.proyecto WHERE id=project_id FOR UPDATE;
      IF state IN ('Cerrado exitoso','Cerrado con observaciones') THEN
        RAISE EXCEPTION 'No se puede archivar evidencia de un proyecto cerrado';
      END IF;
    END LOOP;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tr_documento_cierre_vigente BEFORE UPDATE OR DELETE ON pmo_cusn.documento
FOR EACH ROW EXECUTE FUNCTION pmo_cusn.impedir_archivar_evidencia_de_cierre();
