import { calendarDays, type CivilDate } from '../shared/civil-date';
import { addMoney, divideRounded, percentOf, type Money } from '../shared/money';

export function spi(planned: string, actual: string): { percent: string; ratio: string } {
  const valid = (value: string) => /^\d{1,3}(?:\.\d{1,2})?$/.test(value) && Number(value) <= 100;
  if (!valid(planned) || !valid(actual)) throw new Error('Avance fuera de escala');
  const scaled = (value: string) => { const [w = '0', f = ''] = value.split('.'); return BigInt(w) * 100n + BigInt(f.padEnd(2, '0')); };
  const denominator = scaled(planned);
  const tenThousandths = denominator === 0n ? 0n : divideRounded(scaled(actual) * 1000000n, denominator);
  const percent = `${tenThousandths / 10000n}.${String(tenThousandths % 10000n).padStart(4, '0')}`;
  const ratioScaled = denominator === 0n ? 0n : divideRounded(scaled(actual) * 10000n, denominator);
  return { percent, ratio: `${ratioScaled / 10000n}.${String(ratioScaled % 10000n).padStart(4, '0')}` };
}
export function cpi(rows: readonly { projectId: string; unit: string; period: CivilDate; planned: Money | null; reported: Money | null }[], projectId: string, unit: string, cutoffMonth: string): string | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(cutoffMonth)) throw new Error('Período inválido');
  const relevant = rows.filter(row => row.projectId === projectId && row.unit === unit && row.period.slice(0, 7) <= cutoffMonth);
  return percentOf(addMoney(relevant.map(row => row.reported ?? 0n as Money)), addMoney(relevant.map(row => row.planned ?? 0n as Money)));
}
export function baselineDeviation(baseline: CivilDate, current: CivilDate): number { return calendarDays(baseline, current); }
