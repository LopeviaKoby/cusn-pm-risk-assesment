import { describe, expect, test } from 'bun:test';
import { complexity } from '../../src/domain/complexity';
import { cpi, spi, baselineDeviation } from '../../src/domain/performance';
import { performanceLight, qualityLight, riskLight } from '../../src/domain/health';
import { evaluateClosure } from '../../src/domain/closure';
import { civilDate, santiagoDate } from '../../src/domain/shared/civil-date';
import { money, moneyText } from '../../src/domain/shared/money';
import { leadTime, purchaseTotal, savings, stage } from '../../src/domain/procurement';
import { isOperationalRisk } from '../../src/domain/projects/state';

describe('reglas de negocio puras', () => {
  test('IC exacto, rangos, override y escala', () => {
    expect(complexity({ riesgo: 3, facturacion: 3, plazo: 3, alcance: 3 })).toEqual({ index: '3.0', level: 'Medio' });
    expect(complexity({ riesgo: 1, facturacion: 1, plazo: 1, alcance: 1 }).level).toBe('Bajo');
    expect(complexity({ riesgo: 5, facturacion: 5, plazo: 5, alcance: 5 }).level).toBe('Estratégico');
    expect(() => complexity({ riesgo: 6, facturacion: 1, plazo: 1, alcance: 1 })).toThrow();
    expect(() => complexity({ riesgo: 1, facturacion: 1, plazo: 1, alcance: 1 }, { reason: '', permitted: true })).toThrow();
  });
  test('SPI ratio, porcentaje y base cero', () => {
    expect(spi('25', '50')).toEqual({ percent: '200.0000', ratio: '2.0000' });
    expect(spi('0', '20').percent).toBe('0.0000');
    expect(spi('0.01', '100').percent).toBe('1000000.0000');
    expect(spi('1.28', '0.01')).toEqual({ percent: '0.7813', ratio: '0.0078' });
  });
  test('CPI exacto, moneda, proyecto y corte inclusivo', () => {
    const rows = [
      { projectId: '1', unit: 'USD', period: civilDate('2026-11-01'), planned: money('100.0000'), reported: money('90.0000') },
      { projectId: '1', unit: 'PEN', period: civilDate('2026-11-01'), planned: money('200.0000'), reported: money('100.0000') },
      { projectId: '2', unit: 'USD', period: civilDate('2026-11-01'), planned: money('100.0000'), reported: money('0.0000') },
      { projectId: '1', unit: 'USD', period: civilDate('2026-12-01'), planned: money('100.0000'), reported: money('0.0000') },
    ];
    expect(cpi(rows, '1', 'USD', '2026-11')).toBe('90.0000');
    expect(cpi(rows, '1', 'USD', '2026-10')).toBeNull();
    expect(cpi([{ projectId: '1', unit: 'USD', period: civilDate('2026-11-01'), planned: money('1.2800'), reported: money('0.0100') }], '1', 'USD', '2026-11')).toBe('0.7813');
    expect(baselineDeviation(civilDate('2026-10-31'), civilDate('2026-11-02'))).toBe(2);
  });
  test('semáforos y precedencia', () => {
    expect(performanceLight('69.9999')).toBe('ROJO');
    expect(performanceLight('90.0000')).toBe('VERDE');
    expect(riskLight([15, 8, 4])).toBe('ROJO');
    expect(riskLight([15, null])).toBe('ROJO');
    expect(riskLight([7, 6, 5])).toBe('AMARILLO');
    expect(riskLight([null])).toBe('SIN_DATOS');
    expect(qualityLight(1, 4)).toBe('ROJO');
  });
  test('cierre exige checklist, documentos, lección y riesgos vinculados', () => {
    const item = { completed: true, requiresDocument: true, hasCurrentDocument: true };
    expect(evaluateClosure('1', [item], 1, [
      { projectId: '1', state: 'Mitigado', strategy: 'Transferir' },
      { projectId: null, state: 'Pendiente', strategy: null },
    ]).state).toBe('Cerrado con observaciones');
    expect(() => evaluateClosure('1', [], 1, [])).toThrow();
    expect(() => evaluateClosure('1', [item], 0, [])).toThrow();
    expect(() => evaluateClosure('1', [item], 1, [{ projectId: '1', state: 'Contingencia', strategy: null }])).toThrow();
  });
  test('compra, ahorro cero y lead times', () => {
    expect(moneyText(purchaseTotal(money('10.0000'), money('2.5000'), 3))).toBe('17.5000');
    expect(moneyText(savings(money('100.0000'), money('0.0000'))!)).toBe('100.0000');
    expect(savings(money('100.0000'), null)).toBeNull();
    expect(stage({ BORP: 'x', CONFORMIDAD: 'ok' })).toBe('OK');
    expect(leadTime(civilDate('2026-10-31'), civilDate('2026-11-02'))).toBe(2);
  });
  test('fecha civil de Santiago alrededor de medianoche UTC', () => {
    expect(String(santiagoDate(new Date('2026-11-02T02:59:59Z')))).toBe('2026-11-01');
    expect(String(santiagoDate(new Date('2026-11-02T03:00:00Z')))).toBe('2026-11-02');
    expect(() => civilDate('2026-02-29')).toThrow();
  });
  test('riesgo operacional se deriva sin cambiar su categoría', () => {
    expect(isOperationalRisk('Cerrado exitoso', true)).toBe(true);
    expect(isOperationalRisk('En ejecución', true)).toBe(false);
    expect(isOperationalRisk('Cerrado con observaciones', false)).toBe(false);
  });
});
