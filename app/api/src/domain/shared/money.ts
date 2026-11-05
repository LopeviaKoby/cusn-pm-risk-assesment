export type Money = bigint & { readonly __money: unique symbol };
const SCALE = 10000n;

export function money(value: string): Money {
  if (!/^-?\d{1,16}(?:\.\d{1,4})?$/.test(value)) throw new Error('Importe decimal inválido');
  const negative = value.startsWith('-');
  const [whole = '0', fraction = ''] = value.replace(/^-/, '').split('.');
  const scaled = BigInt(whole) * SCALE + BigInt(fraction.padEnd(4, '0'));
  return (negative ? -scaled : scaled) as Money;
}

export function moneyText(value: Money): string {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}${absolute / SCALE}.${String(absolute % SCALE).padStart(4, '0')}`;
}

export function addMoney(values: readonly Money[]): Money {
  return values.reduce<bigint>((sum, value) => sum + value, 0n) as Money;
}

export function subtractMoney(left: Money, right: Money): Money { return (left - right) as Money; }
export function multiplyMoney(value: Money, multiplier: number): Money {
  if (!Number.isSafeInteger(multiplier) || multiplier < 0) throw new Error('Multiplicador inválido');
  return (value * BigInt(multiplier)) as Money;
}

export function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error('División por cero');
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  const absolute = (value: bigint) => value < 0n ? -value : value;
  return absolute(remainder) * 2n >= absolute(denominator)
    ? quotient + ((numerator < 0n) !== (denominator < 0n) ? -1n : 1n)
    : quotient;
}

export function percentOf(numerator: Money, denominator: Money): string | null {
  if (denominator === 0n) return null;
  const scaled = divideRounded(numerator * 1000000n, denominator);
  return moneyText(scaled as Money);
}
