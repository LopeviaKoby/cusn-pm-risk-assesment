export const date = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value.includes("T") ? value : `${value}T12:00:00Z`)) : "Sin dato";
export const percent = (value: number | null | undefined) => value == null ? "Sin dato" : new Intl.NumberFormat("es-PE", { style: "percent", maximumFractionDigits: 1 }).format(value);
export const number = (value: number | null | undefined) => value == null ? "Sin dato" : new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(value);
export const money = (value: string | null | undefined, unit: string | null | undefined) => value == null ? "Sin dato" : `${unit ?? ""} ${value}`.trim();
export const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
