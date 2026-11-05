import { sql } from '../../db';
import { ApiError } from '../../errors';
import { assertPermission } from '../../authorization';
import { lockProject, resolvePlanChange } from '../../repositories/writes';
import { money, moneyText } from '../../domain/shared/money';
import { isClosedProject } from '../../domain/projects/state';
import { drizzle } from 'drizzle-orm/bun-sql';
import { eq } from 'drizzle-orm';
import { billingMilestones } from './schema';
import type { ChangePort, PlanRequest } from '../../application/ports/changes';

const dateText = (value: unknown): string | null => value == null ? null : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

export async function requestPlanChange(input: PlanRequest, actor: string): Promise<{ id: string; state: string }> {
  return sql.begin(async tx => {
    const project = await lockProject(tx, input.projectKey);
    const projectId = project.key;
    if (isClosedProject(String(project.estado_actual))) throw new ApiError(409,'PROJECT_CLOSED','Reabre el proyecto antes de solicitar fechas.');
    await assertPermission(actor, 'cambios.solicitar', projectId, tx);
    await assertPermission(actor, 'proyectos.consultar', projectId, tx);
    const exception = input.exceptionReason !== undefined;
    if (exception === Boolean(input.controlChangeId)) throw new ApiError(422, 'CHANGE_SOURCE', 'Indica CC firmado o excepción justificada.');
    if (exception) await assertPermission(actor, 'cambios.crear', projectId, tx);
    if (input.controlChangeId) {
      const [cc] = await tx<{ id: string; signed: string; used: boolean }>`SELECT id::text,estado_firma signed,
        EXISTS(SELECT 1 FROM pmo_cusn.solicitud_cambio_planificacion s WHERE s.control_cambio_id=c.id AND s.estado='APROBADO') used
        FROM pmo_cusn.control_cambio c WHERE id::text=${input.controlChangeId} AND proyecto_id=${projectId} FOR UPDATE`;
      if (!cc || cc.signed !== 'FIRMADO' || cc.used) throw new ApiError(409, 'CC_UNAVAILABLE', 'El CC debe estar firmado, pertenecer al proyecto y no estar consumido.');
    }
    const map = { FECHA_INICIO: 'fecha_inicio', FECHA_TERMINO: 'fecha_termino_actual', FECHA_OPERACION_INICIO: 'fecha_inicio', FECHA_OPERACION_TERMINO: 'fecha_termino' } as const;
    const column = map[input.field];
    let previous: unknown = project[column];
    if (input.field.startsWith('FECHA_OPERACION')) {
      const [operation] = await tx<Record<string, unknown>>`SELECT * FROM pmo_cusn.servicio_operativo WHERE proyecto_id=${projectId} FOR UPDATE`;
      if (!operation) throw new ApiError(409, 'OPERATION_REQUIRED', 'No existe servicio operativo.');
      previous = operation[column];
    }
    const old = dateText(previous);
    if (!old || old === input.proposed) throw new ApiError(422, 'INVALID_DATE_CHANGE', 'La fecha anterior debe existir y diferir de la propuesta.');
    const [created] = await tx<{ id: string }>`INSERT INTO pmo_cusn.solicitud_cambio_planificacion
      (proyecto_id,control_cambio_id,solicitante_id,campo,valor_anterior,valor_propuesto,es_excepcion,justificacion)
      VALUES (${projectId},${input.controlChangeId ?? null},${actor},${input.field},${old},${input.proposed},${exception},${input.exceptionReason ?? null})
      RETURNING id::text`;
    return { id: created!.id, state: 'PENDIENTE' };
  });
}

export async function decidePlanChange(id: string, decision: 'APROBADO' | 'RECHAZADO', actor: string, note?:string): Promise<{ id: string; state: string }> {
  await sql.begin(async tx => {
    await resolvePlanChange(tx, id, decision, actor);
    if(note)await tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,motivo,detalle)
      SELECT proyecto_id,${actor},'RESOLUCION_PLANIFICACION',${note},${JSON.stringify({solicitudId:id,decision})}::jsonb FROM pmo_cusn.solicitud_cambio_planificacion WHERE id::text=${id}`;
  });
  return { id, state: decision };
}

export async function approveEconomicChange(id: string, period: string | undefined, actor: string): Promise<{ id: string; billingId: string | null; state: 'APROBADO' }> {
  return sql.begin(async tx => {
    const [ref] = await tx<{ project_id: string }>`SELECT proyecto_id::text project_id FROM pmo_cusn.control_cambio WHERE id::text=${id}`;
    if (!ref) throw new ApiError(404, 'NOT_FOUND', 'CC no encontrado.');
    const project = await lockProject(tx, ref.project_id);
    await assertPermission(actor, 'cambios.aprobar', project.key, tx);
    await assertPermission(actor, 'facturacion.reportar', project.key, tx);
    const [cc] = await tx<{ id: string; folio: string; state: string | null; signed: string; amount: string | null; impact: string | null; unit: string | null }>`
      SELECT id::text,folio,estado_aprobacion state,estado_firma signed,impacto_monetario::text amount,tipo_impacto impact,unidad_codigo unit
      FROM pmo_cusn.control_cambio WHERE id::text=${id} AND proyecto_id=${project.key} FOR UPDATE`;
    if (!cc || cc.signed !== 'FIRMADO') throw new ApiError(409, 'CC_UNSIGNED', 'El CC no está firmado.');
    if (cc.amount !== null && (!period || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period))) throw new ApiError(422, 'PERIOD_REQUIRED', 'El CC económico exige período YYYY-MM.');
    if (cc.amount !== null && (!cc.impact || !cc.unit)) throw new ApiError(422, 'ECONOMIC_DATA_REQUIRED', 'El CC requiere tipo de impacto y unidad.');
    const absolute = cc.amount === null ? null : moneyText((money(cc.amount) < 0n ? -money(cc.amount) : money(cc.amount)) as ReturnType<typeof money>);
    const signed = absolute === null ? null : cc.impact === 'COSTO_TIVIT' ? `-${absolute}` : absolute;
    const [existing] = await drizzle(tx).select({ id: billingMilestones.id, period: billingMilestones.periodo,
      amount: billingMilestones.realReportado, unit: billingMilestones.unidadCodigo })
      .from(billingMilestones).where(eq(billingMilestones.controlCambioId, BigInt(id)));
    if (cc.state === 'APROBADO') {
      if (cc.amount !== null && (!existing || existing.period !== `${period}-01` || existing.amount === null || money(existing.amount) !== money(signed!) || existing.unit !== cc.unit))
        throw new ApiError(409, 'CC_ALREADY_APPLIED', 'El aporte ya aprobado no coincide con el período o importe solicitado.');
      if (cc.amount === null && existing) throw new ApiError(409, 'CC_ALREADY_APPLIED', 'Existe un aporte inesperado para este CC.');
      return { id, billingId: existing?.id.toString() ?? null, state: 'APROBADO' };
    }
    if (cc.state === 'RECHAZADO') throw new ApiError(409, 'CC_REJECTED', 'El CC fue rechazado.');
    await tx`UPDATE pmo_cusn.control_cambio SET estado_aprobacion='APROBADO',aprobador_economico_id=${actor},fecha_aprobacion_economica=now() WHERE id=${id}`;
    let billingId: string | null = null;
    if (signed !== null) {
      const [inserted] = await tx<{ id: string }>`INSERT INTO pmo_cusn.hito_facturacion
        (proyecto_id,periodo,unidad_codigo,real_reportado,origen,origen_ref,control_cambio_id,tipo_impacto_cc,comentario)
        VALUES (${project.key},${period + '-01'},${cc.unit},${signed},'CAMBIO',${cc.folio},${id},${cc.impact},'Aporte de CC aprobado') RETURNING id::text`;
      billingId = inserted!.id;
    }
    await tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,detalle)
      VALUES (${project.key},${actor},'APROBACION_ECONOMICA_CC',${JSON.stringify({ controlCambioId: id, hitoId: billingId, periodo: period ?? null })}::jsonb)`;
    return { id, billingId, state: 'APROBADO' };
  });
}

export const changePort: ChangePort = { request: requestPlanChange, decide: decidePlanChange, approveEconomic: approveEconomicChange };
