import { calendarDays, type CivilDate } from '../shared/civil-date';
import { addMoney, multiplyMoney, subtractMoney, type Money } from '../shared/money';
export type ProcurementStage = 'SOLICITADA' | 'BORP' | 'SOLPED' | 'OC' | 'OK';
export function purchaseTotal(setup: Money, recurring: Money, months: number): Money { return addMoney([setup, multiplyMoney(recurring, months)]); }
export function savings(budget: Money | null, awarded: Money | null): Money | null { return budget === null || awarded === null ? null : subtractMoney(budget, awarded); }
export function stage(references: { BORP?: string | null; SOLPED?: string | null; OC?: string | null; CONFORMIDAD?: string | null }): ProcurementStage {
  return references.CONFORMIDAD?.trim() ? 'OK' : references.OC?.trim() ? 'OC' : references.SOLPED?.trim() ? 'SOLPED' : references.BORP?.trim() ? 'BORP' : 'SOLICITADA';
}
export function leadTime(from: CivilDate | null, to: CivilDate | null): number | null { return from && to ? calendarDays(from, to) : null; }
