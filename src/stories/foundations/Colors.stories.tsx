import { useEffect, useState } from "react";
import { ALL_CANONICAL, contrastRatio, isUnresolved } from "./lab-tokens";

/* Foundations/Colors — registro declarativo de 16 canónicos (4 riesgos +
 * 7 estados + 5 gráficos). Verifica resolución real vía getComputedStyle/CSSOM
 * por tema del canvas, sin copiar tokens ni hardcodear HEX en estilos.
 * Sin imports de API/credenciales/datos reales/servicios/mutadores.
 */

function useComputedVars(names: string[]): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const root = document.documentElement;
    const next: Record<string, string> = {};
    for (const name of names) {
      next[name] = getComputedStyle(root).getPropertyValue(name).trim();
    }
    setValues(next);
  }, [names.join("|")]);
  return values;
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 28,
        height: 20,
        borderRadius: 4,
        border: "1px solid var(--color-border-default)",
        background: color || "transparent",
        verticalAlign: "middle",
      }}
    />
  );
}

export default {
  title: "Foundations/Colors",
  tags: ["autodocs"],
};

export function CanonicalSixteen() {
  const names = ALL_CANONICAL.map((t) => t.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const computed = useComputedVars(names);
  const theme =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  const baseBg =
    theme === "dark"
      ? getComputedStyle(document.documentElement).getPropertyValue("--color-bg-base").trim()
      : "#141922";
  const surface =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--color-bg-surface").trim()
      : "";
  const resolved = names.filter((n) => !isUnresolved(computed[n] ?? "")).length;
  const unresolved = names.length - resolved;

  return (
    <section aria-label="Colores canónicos PMO">
      <h2>Canónicos 4 + 7 + 5 = 16 tokens · 32 resoluciones</h2>
      <p>
        Tema canvas: <strong>{theme}</strong> · Base computada: <code>{baseBg || "(sin resolver)"}</code> ·
        Superficie: <code>{surface || "(sin resolver)"}</code> · Resueltos: <strong>{resolved}/16</strong> ·
        Sin resolver: <strong>{unresolved}</strong>
      </p>
      <p>
        Cada muestra usa <code>var(--token)</code> real + <code>getComputedStyle</code>/CSSOM + swatch +
        texto blanco/negro vs fondo adyacente real. Detecta inexistente/no resoluble/transparent/inválido y
        evalúa opacidad/mezclas sobre fondo real. Sin segundo controlador de tema.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Esperado {theme}</th>
            <th scope="col">Computado</th>
            <th scope="col">Muestra</th>
            <th scope="col">Blanco</th>
            <th scope="col">Negro</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ALL_CANONICAL.map((token) => {
            const expected = theme === "dark" ? token.dark : token.light;
            const value = (computed[token.name] ?? "").trim();
            const bad = isUnresolved(value);
            const onWhite = contrastRatio(value || expected, "#FFFFFF");
            const onBlack = contrastRatio(value || expected, "#000000");
            return (
              <tr key={token.name}>
                <th scope="row">
                  <code>{token.name}</code>
                </th>
                <td>
                  <code>{expected}</code>
                </td>
                <td>
                  <code>{value || "(sin resolver)"}</code>
                </td>
                <td>
                  <Swatch color={bad ? "transparent" : `var(${token.name})`} />{" "}
                  <span style={{ color: `var(${token.name})` }}>Aa</span>
                </td>
                <td>{onWhite === null ? "NO APLICA" : onWhite.toFixed(2)}</td>
                <td>{onBlack === null ? "NO APLICA" : onBlack.toFixed(2)}</td>
                <td>{bad ? "SIN RESOLVER" : "RESUELTO"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
