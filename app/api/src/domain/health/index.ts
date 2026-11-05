export type Light = 'ROJO' | 'AMARILLO' | 'VERDE' | 'SIN_DATOS';
export function performanceLight(percent: string | null): Light {
  if (percent === null) return 'SIN_DATOS';
  const value = Number(percent);
  if (!Number.isFinite(value)) throw new Error('Indicador inválido');
  return value < 70 ? 'ROJO' : value < 90 ? 'AMARILLO' : 'VERDE';
}
export function riskLight(openSeverities: readonly (number | null)[]): Light {
  if (openSeverities.length === 0) return 'VERDE';
  if (openSeverities.some(value => value! >= 15)) return 'ROJO';
  if (openSeverities.length >= 3) return 'AMARILLO';
  if (openSeverities.some(value => value === null)) return 'SIN_DATOS';
  return openSeverities.some(value => value! >= 8) ? 'AMARILLO' : 'VERDE';
}
export function qualityLight(contingencies: number, openChanges: number): Light {
  if (contingencies < 0 || openChanges < 0) throw new Error('Conteo inválido');
  return contingencies > 0 ? 'ROJO' : openChanges >= 3 ? 'AMARILLO' : 'VERDE';
}
