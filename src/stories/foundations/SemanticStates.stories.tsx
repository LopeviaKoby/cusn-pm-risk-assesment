import { useEffect, useState } from "react";
import { RISK_TOKENS, STATUS_TOKENS } from "./lab-tokens";

/* Semantic States — 7 estados ES + 4 riesgos. Sin blocked/completed extra.
 * Leyendas y series nunca solo color: nombre + valor + icono/patrón.
 * Respeta separaciones lifecycle ≠ salud/SPI ≠ riesgo ≠ entregable.
 */

function useThemeName(): string {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  return theme;
}

function useVar(name: string): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  }, [name]);
  return value;
}

function Chip({ bg, fg, label, detail }: { bg: string; fg: string; label: string; detail: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        borderRadius: 9999,
        background: bg,
        color: fg,
        border: `1px solid ${fg}`,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: fg }} />
      <span>{label}</span>
      <span style={{ fontWeight: 400, opacity: 0.9 }}>{detail}</span>
    </span>
  );
}

export default {
  title: "Foundations/Semantic States",
  tags: ["autodocs"],
};

export function StatesAndRisks() {
  const theme = useThemeName();
  const surface = useVar("--color-bg-surface");
  return (
    <section aria-label="Estados semánticos y riesgos">
      <h2>7 estados + 4 riesgos (tema {theme})</h2>
      <p>
        Superficie adyacente real: <code>{surface || "(sin resolver)"}</code>. Cada chip separa
        acento/texto/superficie; no usa blanco automático en saturados. En transición no es
        completed/pending; Requiere P1P2 no es planning; Detenido es on-hold, no blocked; Cancelado +
        2 cierres son finales sin alterar transiciones.
      </p>
      <h3>Estados (técnica + ES + descripción)</h3>
      <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0 }}>
        {STATUS_TOKENS.map((s) => (
          <li key={s.slug}>
            <Chip
              bg={`color-mix(in srgb, var(${s.name}) 12%, var(--color-bg-surface))`}
              fg={`var(${s.name})`}
              label={`${s.label} · ${s.slug}`}
              detail={`${s.name} · ${s.description}`}
            />
          </li>
        ))}
      </ul>
      <h3>Riesgos (4 bandas, taxonomía 1-5 vs 4 bandas sin equiparar nivel a banda)</h3>
      <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0 }}>
        {RISK_TOKENS.map((r, index) => (
          <li key={r.name}>
            <span
              className="exposure"
              data-band={["risk-low", "risk-medium", "risk-high", "risk-critical"][index]}
              title={`${r.name} banda ${index + 1}`}
              style={{ marginRight: 8 }}
            >
              <span aria-hidden="true">{[3, 7, 12, 20][index]}</span>
              <span className="sr-only">{`${r.name} exposición ${[3, 7, 12, 20][index]}`}</span>
            </span>
            <code>{r.name}</code> <span>· banda {index + 1} · cálculo/modelo sin cambios</span>
          </li>
        ))}
      </ul>
      <p>
        Sin <code>--color-status-blocked</code> ni <code>completed</code>/<code>pending</code> canónicos:
        auditados aparte, no mapeados. Genéricos <code>on-track</code>/<code>completed</code>/
        <code>blocked</code>/<code>pending</code> clasificados como no canónicos.
      </p>
    </section>
  );
}
