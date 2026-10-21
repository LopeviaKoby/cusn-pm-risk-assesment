import { billingMilestones, purchases } from "./data";

export const money = (value: number | null | undefined, currency: string) => value == null ? "Sin dato" : `${currency} ${new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
export const monthLabel = (period: string) => new Intl.DateTimeFormat("es-PE", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${period}-01T12:00:00Z`));
export const sumKnown = (values: (number | null | undefined)[]) => values.some(value => value != null) ? Math.round(values.reduce<number>((sum, value) => sum + (value ?? 0), 0) * 100) / 100 : null;
export type FinanceRow = { projectId: string; period: string; showPricing: number | null; planned: number | null; actual: number | null; difference: number | null; sources: string[]; statuses: string[] };
export function financeRows(projectIds: string[], currency: string, period = "") {
  const groups = new Map<string, FinanceRow>();
  const ensure = (projectId: string, date: string) => {
    const month = date.slice(0, 7), key = `${projectId}:${month}`;
    if (period && month !== period) return;
    if (!groups.has(key)) groups.set(key, { projectId, period: month, showPricing: null, planned: null, actual: null, difference: null, sources: [], statuses: [] });
    return groups.get(key)!;
  };
  for (const record of billingMilestones.filter(row => projectIds.includes(row.projectId) && row.currency === currency)) {
    for (const [series, value, date, origin] of [["showPricing", record.showPricingAmount, record.showPricingDate, record.showPricingOrigin], ["planned", record.plannedAmount, record.plannedDate, record.plannedOrigin], ["actual", record.actualAmount, record.actualDate, record.actualOrigin]] as const) {
      if (value === null || !date) continue;
      const group = ensure(record.projectId, date);
      if (!group) continue;
      group[series] = sumKnown([group[series], value]);
      group.sources.push(`${record.title} · ${origin} · ${date}${record.invoiceReference && series === "actual" ? ` · ${record.invoiceReference}` : ""}`);
      group.statuses.push(series === "actual" ? record.invoiceReference ? "Factura emitida" : "Real sin factura acreditada" : "Referencia de planificación");
    }
  }
  return [...groups.values()].map(row => ({ ...row, statuses: [...new Set(row.statuses)], sources: [...new Set(row.sources)], difference: row.actual !== null && row.planned !== null ? Math.round((row.actual - row.planned) * 100) / 100 : null })).sort((a, b) => a.period.localeCompare(b.period) || a.projectId.localeCompare(b.projectId));
}
export function financeModel(projectIds: string[], currency: string, period = "") {
  const rows = financeRows(projectIds, currency, period);
  const months = [...new Set(rows.map(row => row.period))].sort().map(month => {
    const monthly = rows.filter(row => row.period === month);
    return { period: month, showPricing: sumKnown(monthly.map(row => row.showPricing)), planned: sumKnown(monthly.map(row => row.planned)), actual: sumKnown(monthly.map(row => row.actual)) };
  });
  const costs = purchases.filter(row => projectIds.includes(row.projectId) && row.currency === currency);
  return { rows, months, showPricing: sumKnown(rows.map(row => row.showPricing)), planned: sumKnown(rows.map(row => row.planned)), actual: sumKnown(rows.map(row => row.actual)), difference: sumKnown(rows.map(row => row.difference)), costs: { expected: sumKnown(costs.filter(row => !period || row.expectedCostDate.startsWith(period)).map(row => row.expectedAmount)), actual: sumKnown(costs.filter(row => !period || row.actualCostDate?.startsWith(period)).map(row => row.actualAmount)) } };
}
