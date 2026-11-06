import { expect, test } from 'vitest';
import { money } from '../app/src/data/format';
test('NULL financiero se distingue de un cero registrado', () => {
  expect(money(null, 'USD')).toBe('Sin dato');
  expect(money('0.0000', 'USD')).toBe('USD 0.0000');
});
