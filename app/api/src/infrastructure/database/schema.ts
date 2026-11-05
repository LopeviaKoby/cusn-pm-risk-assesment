import { pgSchema, bigint, numeric, date, text, boolean, timestamp } from 'drizzle-orm/pg-core';

// Proyección tipada de las tablas usadas por los nuevos casos de uso. Los 49
// contratos completos se generan desde PostgreSQL en app/api/src/models.ts.
const pmo = pgSchema('pmo_cusn');
export const projects = pmo.table('proyecto', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  tvt: text('tvt').notNull(),
  estadoActual: text('estado_actual').notNull(),
  fechaTerminoBaseline: date('fecha_termino_baseline', { mode: 'string' }),
  fechaTerminoActual: date('fecha_termino_actual', { mode: 'string' }),
  fechaCierreReal: date('fecha_cierre_real', { mode: 'string' }),
  periodoCierreMes: text('periodo_cierre_mes'),
  activo: boolean('activo').notNull(),
});
export const controlChanges = pmo.table('control_cambio', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  proyectoId: bigint('proyecto_id', { mode: 'bigint' }).notNull(),
  estadoFirma: text('estado_firma').notNull(),
  estadoAprobacion: text('estado_aprobacion'),
  impactoMonetario: numeric('impacto_monetario', { precision: 20, scale: 4 }),
  tipoImpacto: text('tipo_impacto'),
  unidadCodigo: text('unidad_codigo'),
  aprobadorEconomicoId: bigint('aprobador_economico_id', { mode: 'bigint' }),
  fechaAprobacionEconomica: timestamp('fecha_aprobacion_economica', { withTimezone: true }),
});
export const billingMilestones = pmo.table('hito_facturacion', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  proyectoId: bigint('proyecto_id', { mode: 'bigint' }).notNull(),
  periodo: date('periodo', { mode: 'string' }).notNull(),
  unidadCodigo: text('unidad_codigo'),
  realReportado: numeric('real_reportado', { precision: 20, scale: 4 }),
  origen: text('origen').notNull(),
  origenLegacy: text('origen_legacy'),
  controlCambioId: bigint('control_cambio_id', { mode: 'bigint' }),
  tipoImpactoCc: text('tipo_impacto_cc'),
  margenPorcentaje: numeric('margen_porcentaje', { precision: 5, scale: 2 }),
});
export const purchases = pmo.table('compra', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  proyectoId: bigint('proyecto_id', { mode: 'bigint' }).notNull(),
  presupuesto: numeric('presupuesto', { precision: 20, scale: 4 }),
  montoAdjudicado: numeric('monto_adjudicado', { precision: 20, scale: 4 }),
  ahorro: numeric('ahorro', { precision: 20, scale: 4 }),
  fechaRecepcionEsperada: date('fecha_recepcion_esperada', { mode: 'string' }),
  fechaRecepcionReal: date('fecha_recepcion_real', { mode: 'string' }),
});
export const projectRisks = pmo.table('riesgo_proyecto', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  proyectoId: bigint('proyecto_id', { mode: 'bigint' }),
  riesgoGlobalId: bigint('riesgo_global_id', { mode: 'bigint' }),
  esTransversal: boolean('es_transversal').notNull(),
  nombre: text('nombre').notNull(),
  estado: text('estado').notNull(),
  estrategia: text('estrategia'),
});
export const followups = pmo.table('seguimiento_proyecto', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  proyectoId: bigint('proyecto_id', { mode: 'bigint' }).notNull(),
  fechaRegistro: date('fecha_registro', { mode: 'string' }).notNull(),
  avancePlanificado: numeric('avance_planificado', { precision: 5, scale: 2 }).notNull(),
  avanceReal: numeric('avance_real', { precision: 5, scale: 2 }).notNull(),
  spi: numeric('spi', { precision: 16, scale: 4 }),
});
