/* Laboratorio aislado Fase 3. Sin API, sin credenciales, sin datos reales,
 * sin servicios ni mutadores. Solo registro declarativo de tokens y
 * helpers WCAG puros (sin red). Los HEX esperados son los autorizados;
 * el render verifica resolución real vía getComputedStyle/CSSOM.
 */

export type ThemeName = "light" | "dark";

export interface CanonicalToken {
  name: string;
  light: string;
  dark: string;
}

export const RISK_TOKENS: CanonicalToken[] = [
  { name: "--color-risk-critical", light: "#C4283E", dark: "#FF8C9A" },
  { name: "--color-risk-high", light: "#D97706", dark: "#F3A765" },
  { name: "--color-risk-medium", light: "#F59E0B", dark: "#F1B552" },
  { name: "--color-risk-low", light: "#044D8C", dark: "#82C1FF" },
];

export interface StatusToken extends CanonicalToken {
  slug: string;
  label: string;
  description: string;
}

export const STATUS_TOKENS: StatusToken[] = [
  { name: "--color-status-in-handover", slug: "in-handover", label: "En transición", description: "Cambio de equipo o fase, sin cierre", light: "#044D8C", dark: "#82C1FF" },
  { name: "--color-status-p1p2-required", slug: "p1p2-required", label: "Requiere P1P2", description: "Pendiente de aprobación P1P2, sin movilización", light: "#7C3AED", dark: "#C4A5FF" },
  { name: "--color-status-cancelled", slug: "cancelled", label: "Cancelado", description: "Final lifecycle, no reanuda", light: "#AE0019", dark: "#FF8C9A" },
  { name: "--color-status-on-hold", slug: "on-hold", label: "Detenido", description: "Pausa decidida, reanudable. No es blocked", light: "#9A4B00", dark: "#F3A765" },
  { name: "--color-status-in-progress", slug: "in-progress", label: "En ejecución", description: "Trabajo activo al corte", light: "#0550AE", dark: "#7FB6F0" },
  { name: "--color-status-closed-successfully", slug: "closed-successfully", label: "Cerrado exitoso", description: "Cierre final con evidencias completas", light: "#096343", dark: "#44C48C" },
  { name: "--color-status-closed-with-observations", slug: "closed-with-observations", label: "Cerrado con observaciones", description: "Cierre final con riesgo Transferir u observaciones", light: "#946000", dark: "#F1B552" },
];

export const CHART_TOKENS: CanonicalToken[] = [
  { name: "--color-chart-1", light: "#044D8C", dark: "#82C1FF" },
  { name: "--color-chart-2", light: "#E50022", dark: "#FF7586" },
  { name: "--color-chart-3", light: "#096343", dark: "#44C48C" },
  { name: "--color-chart-4", light: "#F59E0B", dark: "#F1B552" },
  { name: "--color-chart-5", light: "#7C3AED", dark: "#BEA0FF" },
];

export const ALL_CANONICAL: CanonicalToken[] = [...RISK_TOKENS, ...STATUS_TOKENS, ...CHART_TOKENS];

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export type Grade = "PASA" | "NO PASA" | "NO APLICA";

export function gradeNormalText(ratio: number | null): Grade {
  if (ratio === null) return "NO APLICA";
  if (ratio >= 7) return "PASA";
  if (ratio >= 4.5) return "PASA";
  return "NO PASA";
}

export function gradeNonText(ratio: number | null): Grade {
  if (ratio === null) return "NO APLICA";
  return ratio >= 3 ? "PASA" : "NO PASA";
}

export function normalizeComputed(value: string): string {
  return value.trim().toLowerCase();
}

export function isUnresolved(value: string): boolean {
  const v = normalizeComputed(value);
  return v === "" || v === "transparent" || v === "rgba(0, 0, 0, 0)" || v.includes("var(");
}
