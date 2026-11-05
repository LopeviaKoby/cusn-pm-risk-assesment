import { useEffect, useState } from "react";

/* Typography — pesos reales 400/500/600/700 por familia, computadas
 * family/weight/synthesis, fonts.ready/faces, servida vs fallback.
 * Sin síntesis: html { font-synthesis: none }.
 */

function useFontInfo() {
  const [ready, setReady] = useState("pendiente");
  const [faces, setFaces] = useState(0);
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [synthesis, setSynthesis] = useState("");
  useEffect(() => {
    let active = true;
    setHeading(getComputedStyle(document.documentElement).getPropertyValue("--font-heading").trim());
    setBody(getComputedStyle(document.documentElement).getPropertyValue("--font-body").trim());
    setSynthesis(getComputedStyle(document.documentElement).getPropertyValue("font-synthesis").trim() || getComputedStyle(document.body).getPropertyValue("font-synthesis").trim() || getComputedStyle(document.documentElement).fontSynthesis || "");
    if (document.fonts) {
      document.fonts.ready
        .then(() => {
          if (active) {
            setReady("ready");
            setFaces(document.fonts.size);
          }
        })
        .catch(() => {
          if (active) setReady("error");
        });
    } else {
      setReady("sin API");
    }
    return () => {
      active = false;
    };
  }, []);
  return { ready, faces, heading, body, synthesis };
}

const SAMPLE = "ÁÉÍÓÚÜÑñ áéíóúü 1234567890 %#&() ¿? ¡! €";

export default {
  title: "Foundations/Typography",
  tags: ["autodocs"],
};

export function RealWeights() {
  const { ready, faces, heading, body, synthesis } = useFontInfo();
  return (
    <section aria-label="Tipografía real">
      <h2>Pesos reales por familia (sin síntesis)</h2>
      <p>
        Heading: <code>{heading || "(sin resolver)"}</code> · Body: <code>{body || "(sin resolver)"}</code> ·
        font-synthesis computada: <code>{synthesis || "(heredada none)"}</code> · fonts.ready:{" "}
        <strong>{ready}</strong> · caras: <strong>{faces}</strong>
      </p>
      <p>
        Google Sans variable 400–700 (cubre 500/600/700) · Manrope 200–800 (cubre 400/500/600).
        OFL 1.1 en carpeta. Glifos ES (acentos/ñ/números/símbolos) en muestra. Servida local vs
        fallback Segoe UI verificable en Network (TTF funcional; WOFF2 pendiente vía convert-fonts.sh).
        fonts.check() solo insuficiente: se usa fonts.ready + caras.
      </p>
      {[
        { family: "var(--font-heading)", label: "Google Sans / Heading", weights: [400, 500, 600, 700] },
        { family: "var(--font-body)", label: "Manrope / Body", weights: [400, 500, 600, 700] },
      ].map((group) => (
        <div key={group.label}>
          <h3>{group.label}</h3>
          {group.weights.map((w) => (
            <p key={w} style={{ fontFamily: group.family, fontWeight: w, margin: "4px 0" }}>
              {w} · {SAMPLE}
            </p>
          ))}
        </div>
      ))}
      <h3>Escala normativa (14 estilos + móviles)</h3>
      <ul>
        <li>H1 32/40 700 · H2 28/36 600 · H3 24/32 600 · H4 20/28 600 · Subtitle 18/26 500</li>
        <li>Body-lg 16/26 400 · Body 14/22 400 · Body-sm 13/20 400 · Caption 12/18 500</li>
        <li>Action 14/20 600 · Entry 14/22 400 · Label 13/18 600 · Status 12/16 600 · Metric 28/34 700</li>
        <li>Móvil H1 28/36 · H2 24/32</li>
      </ul>
    </section>
  );
}
