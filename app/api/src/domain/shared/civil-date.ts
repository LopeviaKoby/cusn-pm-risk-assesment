export type CivilDate = string & { readonly __civilDate: unique symbol };
export function civilDate(value: string): CivilDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Fecha civil inválida');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year!, month! - 1, day!);
  date.setUTCHours(0, 0, 0, 0);
  if (date.toISOString().slice(0, 10) !== value) throw new Error('Fecha civil inválida');
  return value as CivilDate;
}
export function calendarDays(from: CivilDate, to: CivilDate): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
}
export function santiagoDate(instant: Date): CivilDate {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return civilDate(`${get('year')}-${get('month')}-${get('day')}`);
}
