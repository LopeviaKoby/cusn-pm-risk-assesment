import { civilDate } from '../../domain/shared/civil-date';
import { BusinessRuleError } from '../../domain/shared/errors';
import type { ChangePort, PlanRequest } from '../ports/changes';

export function submitPlanRequest(port: ChangePort, input: PlanRequest, actorId: string) {
  civilDate(input.proposed);
  if (Boolean(input.controlChangeId) === Boolean(input.exceptionReason?.trim())) throw new BusinessRuleError('CHANGE_SOURCE', 'CC firmado o excepción justificada obligatorios');
  return port.request(input, actorId);
}
export function resolvePlanRequest(port: ChangePort, id: string, decision: 'APROBADO' | 'RECHAZADO', actorId: string, note?:string) {
  if (!/^\d+$/.test(id)) throw new BusinessRuleError('INVALID_ID', 'ID inválido');
  return port.decide(id, decision, actorId,note);
}
