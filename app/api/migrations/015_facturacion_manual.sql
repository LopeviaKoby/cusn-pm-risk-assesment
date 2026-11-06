-- Facturación manual por proyecto: sin cambios al contrato ni CC económicos.
ALTER TABLE pmo_cusn.hito_facturacion ADD COLUMN clave_registro uuid;
ALTER TABLE pmo_cusn.hito_facturacion ADD COLUMN version bigint NOT NULL DEFAULT 1 CHECK(version>0);
CREATE UNIQUE INDEX ux_hito_clave_registro ON pmo_cusn.hito_facturacion(proyecto_id,clave_registro);
CREATE INDEX ix_hito_proyecto_periodo ON pmo_cusn.hito_facturacion(proyecto_id,periodo,id);
CREATE FUNCTION pmo_cusn.validar_hito_manual() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pmo_cusn AS $$
BEGIN
 IF TG_OP='UPDATE' AND (NEW.proyecto_id,NEW.clave_registro,NEW.origen,NEW.origen_ref) IS DISTINCT FROM (OLD.proyecto_id,OLD.clave_registro,OLD.origen,OLD.origen_ref) THEN RAISE EXCEPTION 'Identidad y origen del hito inmutables'; END IF;
 IF NEW.origen IS DISTINCT FROM 'MANUAL' OR NEW.origen_ref IS NOT NULL OR NEW.clave_registro IS NULL OR NEW.unidad_codigo IS NULL
   OR NEW.tipo_hito IS NULL OR NEW.tipo_hito NOT IN ('Proyecto','Operación') OR NEW.tipo_cuota IS NULL OR NEW.tipo_cuota NOT IN ('SetUp','Recurrente')
   OR NEW.showprice IS NULL OR NEW.planificado IS NULL OR NEW.real_reportado IS NULL
   OR NEW.showprice<0 OR NEW.planificado<0 OR NEW.real_reportado<0 THEN RAISE EXCEPTION 'Hito manual incompleto o inválido' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER tr_hito_manual BEFORE INSERT OR UPDATE ON pmo_cusn.hito_facturacion FOR EACH ROW EXECUTE FUNCTION pmo_cusn.validar_hito_manual();