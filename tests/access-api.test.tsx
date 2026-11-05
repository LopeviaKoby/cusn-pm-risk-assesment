import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class ApiError extends Error {
    constructor(readonly status: number, readonly code: string, message: string) {
      super(message);
      this.name = "ApiError";
    }
  }
  return { api: vi.fn(), ApiError };
});

vi.mock("@/data/mode", () => ({ dataMode: "api" }));
vi.mock("@/data/client", () => ({ api: mocks.api, ApiError: mocks.ApiError }));

import { AccessProvider, ThemeProvider, useAccess } from "../src/demo/access";

function ApiAccess() {
  const { signedIn, signIn, signOut } = useAccess();
  return <>
    <output>{signedIn ? "dentro" : "fuera"}</output>
    <button onClick={() => void signIn("lab", "pw").catch(() => undefined)}>Entrar</button>
    <button onClick={() => void signOut()}>Salir</button>
  </>;
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  mocks.api.mockReset();
});

test("la sesión de API se consulta, inicia y cierra", async () => {
  mocks.api.mockResolvedValueOnce({});
  render(<ThemeProvider><AccessProvider><ApiAccess /></AccessProvider></ThemeProvider>);
  await screen.findByText("dentro");
  expect(mocks.api).toHaveBeenCalledWith("/api/v1/sesion");
  mocks.api.mockResolvedValueOnce({});
  fireEvent.click(screen.getByText("Salir"));
  await screen.findByText("fuera");
  expect(mocks.api).toHaveBeenCalledWith("/api/v1/sesion", { method: "DELETE" });
});

test("401 en la comprobación deja la sesión fuera y el login puede entrar", async () => {
  mocks.api.mockRejectedValueOnce(new mocks.ApiError(401, "SESSION_REQUIRED", "Sin sesión"));
  render(<ThemeProvider><AccessProvider><ApiAccess /></AccessProvider></ThemeProvider>);
  await screen.findByText("fuera");
  mocks.api.mockResolvedValueOnce({});
  fireEvent.click(screen.getByText("Entrar"));
  await screen.findByText("dentro");
});

test("un fallo de red al entrar se propaga sin cambiar la sesión", async () => {
  window.history.replaceState(null, "", "/login");
  mocks.api.mockRejectedValueOnce(new Error("network"));
  render(<ThemeProvider><AccessProvider><ApiAccess /></AccessProvider></ThemeProvider>);
  fireEvent.click(screen.getByText("Entrar"));
  await waitFor(() => expect(mocks.api).toHaveBeenCalledWith("/api/v1/sesion", expect.objectContaining({ method: "POST" })));
  expect(screen.getByRole("status")).toHaveTextContent("fuera");
});

test("un fallo al cerrar sesión no bloquea la salida local", async () => {
  window.history.replaceState(null, "", "/login");
  mocks.api.mockResolvedValueOnce({});
  render(<ThemeProvider><AccessProvider><ApiAccess /></AccessProvider></ThemeProvider>);
  fireEvent.click(screen.getByText("Entrar"));
  await screen.findByText("dentro");
  mocks.api.mockRejectedValueOnce(new Error("network"));
  fireEvent.click(screen.getByText("Salir"));
  await screen.findByText("fuera");
});
