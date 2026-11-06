import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LuInfo } from "react-icons/lu";
import { Avatar, Badge, BreadcrumbItem, Button, Checkbox, Divider, Icon, IconButton, RadioButton, Skeleton, Spinner, Switch, TabItem, TextInput, TextLink, Tooltip } from "../app/src/components/atoms/catalog";

test("botones mantienen callbacks, estados de carga y nombre accesible", () => {
  const click = vi.fn();
  render(<><Button variant="destructive" size="lg" onClick={click}>Eliminar</Button><Button loading onClick={click}>Guardar</Button><IconButton icon={LuInfo} label="Información" onClick={click} /></>);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
  fireEvent.click(screen.getByRole("button", { name: "Información" }));
  expect(click).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("aria-busy", "true");
});

test("campos y controles conservan semántica y estados nativos", () => {
  const change = vi.fn();
  render(<><TextInput aria-label="Código" error onChange={change} /><Checkbox aria-label="Todos" indeterminate onChange={change} /><RadioButton aria-label="Semanal" name="cadencia" onChange={change} /><Switch aria-label="Avisos" onChange={change} /></>);
  expect(screen.getByRole("textbox", { name: "Código" })).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("checkbox", { name: "Todos" })).toHaveProperty("indeterminate", true);
  fireEvent.change(screen.getByRole("textbox", { name: "Código" }), { target: { value: "A" } });
  fireEvent.click(screen.getByRole("radio", { name: "Semanal" }));
  fireEvent.click(screen.getByRole("switch", { name: "Avisos" }));
  expect(change).toHaveBeenCalledTimes(3);
});

test("elementos informativos y navegación exponen su significado", () => {
  render(<><Badge tone="review">Revisión</Badge><Avatar initials="MG" name="María Gómez" /><TextLink href="https://example.com" external>Referencia</TextLink><BreadcrumbItem current>Portafolio</BreadcrumbItem><TabItem selected>Resumen</TabItem><Spinner /><Skeleton /><Tooltip text="Ayuda"><IconButton icon={LuInfo} label="Ayuda" /></Tooltip><Icon glyph={LuInfo} /><Divider /></>);
  expect(screen.getByText("Revisión")).toBeVisible();
  expect(screen.getByRole("img", { name: "María Gómez" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Referencia" })).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText("Portafolio")).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("button", { name: "Resumen" })).toHaveAttribute("data-selected", "true");
  expect(screen.getByRole("status", { name: "Cargando" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Ayuda" })).toBeVisible();
});
