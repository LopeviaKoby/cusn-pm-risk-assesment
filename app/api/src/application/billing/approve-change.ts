import type { ChangePort } from '../ports/changes';
import { BusinessRuleError } from '../../domain/shared/errors';
export function approveChangeEconomics(port: ChangePort, id: string, period: string | undefined, actorId: string) {
  if (!/^\d+$/.test(id)) throw new BusinessRuleError('INVALID_ID', 'ID inválido');
  if (period !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new BusinessRuleError('INVALID_PERIOD', 'Período inválido');
  return port.approveEconomic(id, period, actorId);
}
