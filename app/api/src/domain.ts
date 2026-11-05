export const PROJECT_STATES = ["Requiere P1P2", "En ejecución", "En transición", "Detenido", "Cancelado", "Cerrado exitoso", "Cerrado con observaciones"] as const;
export const RISK_STATES = ["Pendiente", "Contingencia", "Controlado", "Mitigado"] as const;
export const RISK_STRATEGIES = ["Mitigar", "Aceptar", "Transferir", "Evitar", "Reducir"] as const;
export const UNITS = ["USD", "PEN", "CLP", "COP", "ARS", "BRL", "PAB", "MXN", "UF"] as const;
export type ProjectState = typeof PROJECT_STATES[number];
export type Unit = typeof UNITS[number];

// numeric(20,4) permanece decimal, incluso durante agregaciones del DTO.
export function sumAmounts(values: string[]): string {
  const scaled = values.reduce((total, value) => {
    if (!/^-?\d+(\.\d{1,4})?$/.test(value)) throw new Error("Decimal no válido.");
    const negative = value.startsWith("-");
    const [whole = "0", fraction = ""] = value.replace(/^-/, "").split(".");
    const amount = BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
    return total + (negative ? -amount : amount);
  }, 0n);
  const absolute = scaled < 0n ? -scaled : scaled;
  return `${scaled < 0n ? "-" : ""}${absolute / 10000n}.${String(absolute % 10000n).padStart(4, "0")}`;
}
