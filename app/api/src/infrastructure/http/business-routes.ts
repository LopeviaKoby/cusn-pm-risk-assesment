import { Hono } from 'hono';
import { z, ZodError } from 'zod';
import { ApiError, respond, respondError } from '../../errors';
import { BusinessRuleError } from '../../domain/shared/errors';
import { assertOrigin, requireSession } from '../../session';
import { santiagoDate } from '../../domain/shared/civil-date';
import { closeProject, reopenProject } from '../../application/projects/closure';
import { closurePort } from '../database/closure';
import { changePort } from '../database/changes';
import { submitPlanRequest, resolvePlanRequest } from '../../application/changes';
import { approveChangeEconomics } from '../../application/billing/approve-change';
import { getProject } from '../../repositories/read';
import { getTransverseRisks } from '../../repositories/read';
import { createTransverseRisk, updateTransverseRisk } from '../../repositories/writes';
import { controls, saveComplexity, editPurchase } from '../database/frontend-flows';

const id = z.string().regex(/^\d+$/);
const date = z.iso.date();
const planRequest = z.strictObject({
  campo: z.enum(['FECHA_INICIO', 'FECHA_TERMINO', 'FECHA_OPERACION_INICIO', 'FECHA_OPERACION_TERMINO']),
  valorPropuesto: date,
  controlCambioId: id.optional(),
  justificacionExcepcion: z.string().trim().min(1).max(5000).optional(),
});
const resolution = z.strictObject({ decision: z.enum(['APROBADO', 'RECHAZADO']),nota:z.string().trim().min(1).max(5000).optional() });
const economicApproval = z.strictObject({ periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() });
const reopen = z.strictObject({ motivo: z.string().trim().min(1).max(5000) });
const transverseCreate = z.strictObject({ riesgoGlobalId: id, nombre: z.string().trim().min(1).max(5000),
  descripcion: z.string().max(5000).nullable().optional(), categoria: z.string().max(5000).nullable().optional(),
  probabilidad: z.number().int().min(1).max(4).optional(), impacto: z.number().int().min(1).max(4).optional(),
  estrategia: z.enum(['Mitigar','Aceptar','Transferir','Evitar','Reducir']).optional() });
const transversePatch = z.strictObject({ nombre: z.string().trim().min(1).max(5000).optional(),
  estado: z.enum(['Pendiente','Contingencia','Controlado','Mitigado']).optional(),
  categoria: z.string().max(5000).nullable().optional(), probabilidad: z.number().int().min(1).max(4).optional(),
  impacto: z.number().int().min(1).max(4).optional(), estrategia: z.enum(['Mitigar','Aceptar','Transferir','Evitar','Reducir']).nullable().optional(),
  planMitigacion: z.string().max(5000).nullable().optional(), planContingencia: z.string().max(5000).nullable().optional() });

async function body(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > 8192) throw new ApiError(413, 'BODY_TOO_LARGE', 'El cuerpo de la petición es demasiado grande.');
  try { return JSON.parse(raw); } catch { throw new ApiError(400, 'INVALID_JSON', 'El cuerpo debe ser JSON válido.'); }
}
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  try { return schema.parse(value); }
  catch (error) {
    if (error instanceof ZodError) throw new ApiError(422, 'INVALID_FIELD', 'Datos de entrada no válidos.', Object.fromEntries(error.issues.map(issue => [issue.path.join('.'), issue.message])));
    throw error;
  }
}
function context(request: Request, requestId: string): { actor: string; requestId: string } {
  assertOrigin(request);
  return { actor: requireSession(request).userId, requestId };
}
export function createBusinessApi(legacy: (request: Request) => Promise<Response>) {
  const app = new Hono<{ Variables: { requestId: string } }>();
  app.use('*', async (c, next) => { c.set('requestId', crypto.randomUUID()); await next(); });
  app.onError((error,c) => respondError(error instanceof BusinessRuleError ? new ApiError(422,error.code,error.message) : error, c.get('requestId')));
  app.post('/api/v1/proyectos/:key/cierre', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    parse(z.strictObject({}), await body(c.req.raw));
    const result = await closeProject(closurePort, c.req.param('key'), actor, santiagoDate(new Date()));
    return respond({ ...result, proyecto: await getProject(actor, result.id) }, requestId);
  });
  app.post('/api/v1/proyectos/:key/reapertura', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    const input = parse(reopen, await body(c.req.raw));
    const result = await reopenProject(closurePort, c.req.param('key'), actor, input.motivo);
    return respond({ ...result, proyecto: await getProject(actor, result.id) }, requestId);
  });
  app.post('/api/v1/proyectos/:key/cambios-planificacion', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    const input = parse(planRequest, await body(c.req.raw));
    const result = await submitPlanRequest(changePort, { projectKey: c.req.param('key'), field: input.campo, proposed: input.valorPropuesto,
      controlChangeId: input.controlCambioId, exceptionReason: input.justificacionExcepcion }, actor);
    return respond(result, requestId, 201);
  });
  app.post('/api/v1/cambios-planificacion/:id/resolucion', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    const input=parse(resolution, await body(c.req.raw));
    const result = await resolvePlanRequest(changePort, parse(id, c.req.param('id')), input.decision, actor,input.nota);
    return respond(result, requestId);
  });
  app.post('/api/v1/controles-cambio/:id/aprobacion-economica', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    const input = parse(economicApproval, await body(c.req.raw));
    const result = await approveChangeEconomics(changePort, parse(id, c.req.param('id')), input.periodo, actor);
    return respond(result, requestId);
  });
  app.get('/api/v1/riesgos/transversales', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    return respond(await getTransverseRisks(actor), requestId);
  });
  app.post('/api/v1/riesgos/transversales', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    return respond(await createTransverseRisk(parse(transverseCreate, await body(c.req.raw)), actor), requestId, 201);
  });
  app.patch('/api/v1/riesgos/transversales/:id', async c => {
    const { actor, requestId } = context(c.req.raw,c.get('requestId'));
    return respond(await updateTransverseRisk(parse(id,c.req.param('id')), parse(transversePatch, await body(c.req.raw)), actor), requestId);
  });
  app.get('/api/v1/controles-cambio',async c=>{
    const {actor,requestId}=context(c.req.raw,c.get('requestId'));
    return respond(await controls(actor),requestId);
  });
  app.get('/api/v1/proyectos/:key/prevalidacion-cierre',async c=>{
    const {actor,requestId}=context(c.req.raw,c.get('requestId'));
    return respond(await closurePort.transact(tx=>tx.load(c.req.param('key'),actor,'proyectos.cerrar')),requestId);
  });
  app.post('/api/v1/proyectos/:key/complejidad',async c=>{
    const {actor,requestId}=context(c.req.raw,c.get('requestId'));
    const factor=z.number().int().min(1).max(5);
    const input=parse(z.strictObject({riesgo:factor,facturacion:factor,plazo:factor,alcance:factor,override:z.boolean(),motivo:z.string().max(5000)}),await body(c.req.raw));
    return respond(await saveComplexity(actor,c.req.param('key'),input),requestId);
  });
  app.patch('/api/v1/compras/:id',async c=>{
    const {actor,requestId}=context(c.req.raw,c.get('requestId'));
    const amount=z.string().regex(/^\d{1,16}(?:\.\d{1,4})?$/).nullable();
    const input=parse(z.strictObject({presupuesto:amount,montoAdjudicado:amount}),await body(c.req.raw));
    return respond(await editPurchase(actor,parse(id,c.req.param('id')),input.presupuesto,input.montoAdjudicado),requestId);
  });
  app.all('*', c => legacy(c.req.raw));
  return app;
}
