export type ComplexityLevel = 'Bajo' | 'Medio' | 'Alto' | 'Estratégico';
export interface Factors { readonly riesgo: number; readonly facturacion: number; readonly plazo: number; readonly alcance: number }
export function complexity(factors: Factors, override?: { readonly reason: string; readonly permitted: boolean }): { index: string; level: ComplexityLevel } {
  for (const value of Object.values(factors)) if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('Factor de complejidad fuera de escala');
  if (override && (!override.permitted || !override.reason.trim())) throw new Error('Override sin permiso o motivo');
  const tenths = Math.floor((factors.riesgo * 35 + factors.facturacion * 20 + factors.plazo * 15 + factors.alcance * 30 + 5) / 10);
  const level: ComplexityLevel = override || tenths >= 45 ? 'Estratégico' : tenths >= 38 ? 'Alto' : tenths >= 26 ? 'Medio' : 'Bajo';
  return { index: `${Math.floor(tenths / 10)}.${tenths % 10}`, level };
}
