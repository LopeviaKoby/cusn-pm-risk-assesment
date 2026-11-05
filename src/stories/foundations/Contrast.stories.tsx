import { contrastRatio, gradeNonText, gradeNormalText } from "./lab-tokens";

/* Contrast — matriz WCAG pares reales. Texto normal AA≥4.5 AAA≥7;
 * no textual AA≥3; grande AA≥3 AAA≥4.5 solo si tamaño/peso verificados.
 * Separa PASA/NO PASA/NO APLICA. Blanco+negro diagnóstico con fallos
 * esperados señalados (medium/high Light vs blanco NO PASA por diseño).
 */

interface Row {
  a: string;
  aName: string;
  b: string;
  bName: string;
  kind: "normal" | "non-text";
  note: string;
}

const LIGHT_ROWS: Row[] = [
  { a: "#044D8C", aName: "risk-low/status in-handover/chart-1", b: "#FFFFFF", bName: "blanco superficie", kind: "normal", note: "Texto sobre claro 8.59 PASA" },
  { a: "#C4283E", aName: "risk-critical/danger", b: "#FFFFFF", bName: "blanco", kind: "normal", note: "5.64 PASA" },
  { a: "#D97706", aName: "risk-high", b: "#FFFFFF", bName: "blanco", kind: "normal", note: "3.19 NO PASA esperado → usar #111827" },
  { a: "#D97706", aName: "risk-high", b: "#111827", bName: "texto primario", kind: "normal", note: "5.57 PASA accesible" },
  { a: "#F59E0B", aName: "risk-medium/chart-4", b: "#FFFFFF", bName: "blanco", kind: "normal", note: "2.15 NO PASA esperado → usar #111827" },
  { a: "#F59E0B", aName: "risk-medium", b: "#111827", bName: "texto primario", kind: "normal", note: "8.26 PASA accesible" },
  { a: "#AE0019", aName: "cancelled", b: "#F7F8FA", bName: "bg-base", kind: "normal", note: "AA sobre base" },
  { a: "#9A4B00", aName: "on-hold", b: "#FFFFFF", bName: "blanco", kind: "normal", note: "6.21 PASA" },
  { a: "#0550AE", aName: "in-progress", b: "#FFFFFF", bName: "blanco", kind: "normal", note: "7.59 PASA/AAA" },
  { a: "#096343", aName: "closed-successfully", b: "#FFFFFF", bName: "blanco", kind: "normal", note: "7.3 PASA/AAA" },
  { a: "#946000", aName: "closed-obs", b: "#FFFFFF", bName: "blanco", kind: "normal", note: "5.34 PASA" },
  { a: "#16794B", aName: "success texto", b: "#E7F6ED", bName: "success-surface", kind: "normal", note: "4.86 PASA chip" },
  { a: "#C4283E", aName: "danger texto", b: "#FCE8EA", bName: "danger-surface", kind: "normal", note: "4.8 PASA chip" },
  { a: "#A85800", aName: "warning texto", b: "#FFF3DC", bName: "warning-surface", kind: "normal", note: "4.7 PASA chip" },
];

const DARK_ROWS: Row[] = [
  { a: "#82C1FF", aName: "risk-low/chart-1", b: "#141922", bName: "bg-base dark", kind: "normal", note: "9.25 PASA/AAA texto sobre oscuro" },
  { a: "#F1B552", aName: "risk-medium/closed-obs", b: "#141922", bName: "bg-base", kind: "normal", note: "9.62 PASA/AAA" },
  { a: "#F3A765", aName: "risk-high/on-hold", b: "#141922", bName: "bg-base", kind: "normal", note: "PASA acento sobre oscuro" },
  { a: "#FF8C9A", aName: "risk-critical/cancelled", b: "#141922", bName: "bg-base", kind: "normal", note: "7.95 PASA/AAA" },
  { a: "#44C48C", aName: "success/closed-successfully", b: "#173B31", bName: "success-surface dark", kind: "normal", note: "5.58 PASA chip" },
];

function Matrix({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Par A</th>
            <th scope="col">Par B</th>
            <th scope="col">Ratio</th>
            <th scope="col">Normal AA/AAA</th>
            <th scope="col">No textual AA</th>
            <th scope="col">Nota</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ratio = contrastRatio(r.a, r.b);
            const gN = r.kind === "normal" ? gradeNormalText(ratio) : "NO APLICA";
            const gG = gradeNonText(ratio);
            return (
              <tr key={i}>
                <td>
                  <span aria-hidden="true" style={{ display: "inline-block", width: 16, height: 12, background: r.a, border: "1px solid #999", marginRight: 6 }} />
                  <code>
                    {r.a} {r.aName}
                  </code>
                </td>
                <td>
                  <code>
                    {r.b} {r.bName}
                  </code>
                </td>
                <td>{ratio === null ? "NO APLICA" : ratio.toFixed(2)}</td>
                <td>{gN}</td>
                <td>{gG}</td>
                <td>{r.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default {
  title: "Foundations/Contrast",
  tags: ["autodocs"],
};

export function WcagMatrix() {
  return (
    <section aria-label="Matriz de contraste WCAG">
      <h2>Pares reales (no extrapolar blanco sobre sólido/overlays)</h2>
      <p>
        Light blanco/#F7F8FA y Dark #141922/#1C222D verificados por par renderizado si fondo/borde/marca.
        Tamaño/peso solo grande si verificado; si no, NO APLICA para AAA grande.
      </p>
      <Matrix title="Light (texto normal AA≥4.5 AAA≥7)" rows={LIGHT_ROWS} />
      <Matrix title="Dark (acentos/texto sobre oscuros)" rows={DARK_ROWS} />
      <p>
        Diagnóstico blanco+negro: fallos esperados en medium/high Light vs blanco (2.15/3.19) señalados
        como NO PASA por diseño; corrección documentada con par accesible oscuro (#111827).
      </p>
    </section>
  );
}
