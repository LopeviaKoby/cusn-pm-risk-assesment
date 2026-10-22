import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Link, NavigationProvider, contextualPath, safeReturn, useNavigation } from "../src/navigation";

test("destinos locales y filtros contextuales no aceptan retornos externos", () => {
  for (const value of [null, "https://example.test", "//example.test", "/login", "javascript:alert(1)"]) expect(safeReturn(value, "/workspace")).toBe("/workspace");
  expect(safeReturn("/proyectos?estado=activo", "/workspace")).toBe("/proyectos?estado=activo");
  expect(contextualPath("/riesgos/R1", "/proyectos?pais=Chile", true)).toContain("lista=");
  expect(contextualPath("/proyectos/P1", "/workspace")).toBe("/proyectos/P1");
  expect(contextualPath("/riesgos", "/workspace?lista=https%3A%2F%2Fexample.test")).toBe("/riesgos?lista=%2Fproyectos");
});
function Nav() {
  const { url, navigate } = useNavigation();
  return <><output>{url}</output><Link href="/proyectos?pais=Chile">Proyectos</Link><Link href="/riesgos" onClick={event => event.preventDefault()}>Cancelado</Link><button onClick={() => navigate("/riesgos", true)}>Reemplazar</button></>;
}
test("navegación SPA, clic modificado, cancelación y popstate", () => {
  render(<NavigationProvider><Nav /></NavigationProvider>);
  expect(screen.getByRole("status")).toHaveTextContent("/workspace");
  fireEvent.click(screen.getByText("Cancelado")); expect(location.pathname).toBe("/workspace");
  fireEvent.click(screen.getByText("Proyectos"), { ctrlKey: true }); expect(location.pathname).toBe("/workspace");
  fireEvent.click(screen.getByText("Proyectos")); expect(location.search).toBe("?pais=Chile");
  fireEvent.click(screen.getByText("Proyectos"));
  fireEvent.click(screen.getByText("Reemplazar")); expect(location.pathname).toBe("/riesgos");
  window.history.replaceState(null, "", "/portafolio?vista=finanzas"); fireEvent.popState(window);
  expect(screen.getByRole("status")).toHaveTextContent("/portafolio?vista=finanzas");
});
