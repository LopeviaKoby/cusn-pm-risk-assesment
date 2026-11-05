import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const mock = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/data/client", () => ({ api: mock.api }));
import { DataProvider, useData } from "../app/src/data/bootstrap";
import { persistRiskEdit } from "../app/src/data/edits";
import { money } from "../app/src/data/format";
import type { Risk } from "../app/src/data/contracts";

function DataView() {
  const { data, loading, error } = useData();
  return <output>{loading ? "cargando" : error ? `error: ${error}` : `proyectos: ${data?.proyectos.length}`}</output>;
}
beforeEach(() => mock.api.mockReset());

test("un fallo de API muestra error y nunca datos sintéticos", async () => {
  mock.api.mockRejectedValueOnce(new Error("Servicio no disponible"));
  render(<DataProvider><DataView /></DataProvider>);
  expect(await screen.findByRole("status")).toHaveTextContent("error: Servicio no disponible");
  expect(screen.queryByText(/proyectos: [1-9]/)).not.toBeInTheDocument();
});

test("NULL financiero se distingue de un cero registrado", () => {
  expect(money(null, "USD")).toBe("Sin dato");
  expect(money("0.0000", "USD")).toBe("USD 0.0000");
});

test("la evaluación de riesgo ausente requiere ambas escalas y no fabrica 1 × 1", async () => {
  const risk: Risk = { id: "42", entidad: "RIESGO_PROYECTO", proyectoId: "7", proyectoTvt: "TVT-7", nombre: "R", causa: null, estado: "Pendiente", categoria: null, probabilidad: null, impacto: null, severidad: null, estrategia: null, planMitigacion: null, planContingencia: null, responsableNombre: null, tipo: "Amenaza", transversal: false, creadoAt: null, actualizadoAt: null };
  await expect(persistRiskEdit(risk, { probability: 2 })).rejects.toThrow(/juntos/);
  expect(mock.api).not.toHaveBeenCalled();
  mock.api.mockResolvedValueOnce({});
  await persistRiskEdit(risk, { probability: 2, impact: 3 });
  await waitFor(() => expect(mock.api).toHaveBeenCalledWith("/api/v1/proyectos/7/riesgos/42", expect.objectContaining({ body: JSON.stringify({ probabilidad: 2, impacto: 3 }) })));
});
