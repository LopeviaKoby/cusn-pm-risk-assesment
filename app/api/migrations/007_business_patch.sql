-- Adaptación mínima del parche de Dimensión 3 al contrato v200 realmente instalado.
-- Se ejecuta dentro de la transacción del migrador; todos los objetos se califican.
ALTER TABLE pmo_cusn.compra
  ADD COLUMN presupuesto numeric(20,4),
  ADD COLUMN fecha_recepcion_esperada date,
  ADD COLUMN fecha_recepcion_real date,
  ADD COLUMN ahorro numeric(20,4) GENERATED ALWAYS AS (
    CASE WHEN presupuesto IS NOT NULL AND monto_adjudicado IS NOT NULL
      THEN presupuesto - monto_adjudicado ELSE NULL END
  ) STORED;

ALTER TABLE pmo_cusn.proyecto
  ADD COLUMN fecha_cierre_real date,
  ADD COLUMN periodo_cierre_mes char(7),
  ADD CONSTRAINT ck_proyecto_periodo_cierre CHECK (
    (fecha_cierre_real IS NULL AND periodo_cierre_mes IS NULL)
    OR (fecha_cierre_real IS NOT NULL AND periodo_cierre_mes = to_char(fecha_cierre_real, 'YYYY-MM'))
  );

ALTER TABLE pmo_cusn.riesgo_proyecto
  ALTER COLUMN proyecto_id DROP NOT NULL,
  ADD COLUMN es_transversal boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT ck_riesgo_transversal_valido CHECK (
    proyecto_id IS NOT NULL OR (es_transversal AND riesgo_global_id IS NOT NULL)
  );

ALTER TABLE pmo_cusn.hito_facturacion
  ADD COLUMN margen_porcentaje numeric(5,2),
  ADD COLUMN origen_legacy text,
  ADD COLUMN control_cambio_id bigint,
  ADD COLUMN tipo_impacto_cc text;

UPDATE pmo_cusn.hito_facturacion
SET origen_legacy = origen, origen = 'MANUAL'
WHERE origen IS DISTINCT FROM 'MANUAL';

ALTER TABLE pmo_cusn.hito_facturacion
  ALTER COLUMN origen SET DEFAULT 'MANUAL',
  ALTER COLUMN origen SET NOT NULL,
  ADD CONSTRAINT ck_hito_margen_rango CHECK (margen_porcentaje BETWEEN 0 AND 100),
  ADD CONSTRAINT ck_hito_origen_valido CHECK (
    (origen = 'MANUAL' AND control_cambio_id IS NULL AND tipo_impacto_cc IS NULL)
    OR (origen = 'CAMBIO' AND control_cambio_id IS NOT NULL AND tipo_impacto_cc IN ('BENEFICIO','COSTO_TIVIT'))
  ),
  ADD CONSTRAINT fk_hito_cc_mismo_proyecto FOREIGN KEY (control_cambio_id, proyecto_id)
    REFERENCES pmo_cusn.control_cambio(id, proyecto_id) ON DELETE RESTRICT;

ALTER TABLE pmo_cusn.seguimiento_proyecto
  ADD COLUMN spi numeric(16,4) GENERATED ALWAYS AS (
    CASE WHEN avance_planificado > 0
      THEN round(avance_real / avance_planificado * 100, 4)
      ELSE 0 END
  ) STORED;

COMMENT ON COLUMN pmo_cusn.compra.ahorro IS 'Presupuesto menos adjudicación; cero adjudicado es válido y ausencia de importe produce NULL.';
COMMENT ON COLUMN pmo_cusn.hito_facturacion.origen_legacy IS 'Valor original v200 antes de normalizar origen; no implica control de cambio verificado.';
COMMENT ON COLUMN pmo_cusn.seguimiento_proyecto.spi IS 'SPI porcentual generado; el ratio se obtiene dividiendo explícitamente entre 100.';
