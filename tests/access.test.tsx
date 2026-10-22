import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { AccessProvider, ThemeProvider, useAccess, useTheme, presentationAccount } from "../src/demo/access";

function Access() {
  const { signedIn, signIn, signOut } = useAccess(); const { light, toggle } = useTheme();
  return <><output>{signedIn ? "dentro" : "fuera"} {light ? "claro" : "oscuro"}</output><button onClick={() => signIn("bad", "bad")}>Incorrecto</button><button onClick={() => signIn(presentationAccount.identifier.toUpperCase(), presentationAccount.password)}>Entrar</button><button onClick={signOut}>Salir</button><button onClick={toggle}>Tema</button></>;
}
test("credenciales ficticias, sesión y tema se mantienen independientes", () => {
  render(<ThemeProvider><AccessProvider><Access /></AccessProvider></ThemeProvider>);
  fireEvent.click(screen.getByText("Incorrecto")); expect(screen.getByRole("status")).toHaveTextContent("fuera claro");
  fireEvent.click(screen.getByText("Tema")); expect(document.documentElement).toHaveClass("dark");
  fireEvent.click(screen.getByText("Entrar")); expect(screen.getByRole("status")).toHaveTextContent("dentro claro");
  expect(sessionStorage.getItem("gpl.demo.access.v1")).toBe("active"); expect(JSON.stringify(sessionStorage)).not.toContain(presentationAccount.password);
  fireEvent.click(screen.getByText("Tema")); fireEvent.click(screen.getByText("Salir")); expect(screen.getByRole("status")).toHaveTextContent("fuera claro");
});
test("almacenamiento no disponible conserva una sesión en memoria", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("disabled"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("disabled"); });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("disabled"); });
  render(<ThemeProvider><AccessProvider><Access /></AccessProvider></ThemeProvider>);
  fireEvent.click(screen.getByText("Entrar")); expect(screen.getByRole("status")).toHaveTextContent("dentro");
  fireEvent.click(screen.getByText("Salir")); expect(screen.getByRole("status")).toHaveTextContent("fuera");
});
