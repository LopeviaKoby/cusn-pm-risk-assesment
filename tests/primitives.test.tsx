import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Badge, Button, Empty, ExposureBadge, Filter, MetricStrip, PageHeading, SearchField, TableFooter, TableRegion, Tabs, TabsContent, TabsList, TabsTrigger } from "../app/src/components/atoms/primitives";
import { RecordDialog } from "../app/src/components/organisms/record-dialog";
import { loadScreen, RouteContent } from "../app/src/components/molecules/route-loader";

test("botones no envían formularios por defecto; búsquedas, filtros y estados son accesibles", () => {
  const submit = vi.fn(), search = vi.fn(), filter = vi.fn(), clear = vi.fn();
  render(<><form onSubmit={submit}><Button>Acción</Button></form><SearchField label="Buscar" value="" onChange={search} /><Filter label="Estado" value="" onChange={filter} options={["Activo", { value: "B", label: "Cerrado" }]} /><Empty onClear={clear} /><Badge>Etiqueta</Badge><ExposureBadge type="Amenaza" score={20} proposed /><MetricStrip items={[{ value: 2, label: "Proyectos" }]} /><PageHeading title="Título" description="Descripción" /><TableFooter count={1} total={2} noun="proyectos" /></>);
  fireEvent.click(screen.getByText("Acción")); expect(submit).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Proyecto" } }); expect(search).toHaveBeenCalledWith("Proyecto");
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "B" } }); expect(filter).toHaveBeenCalledWith("B");
  fireEvent.click(screen.getByText("Limpiar filtros")); expect(clear).toHaveBeenCalledOnce();
  expect(screen.getByRole("heading", { name: "Título" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Mostrando 1 de 2 proyectos");
});

test("tabla avisa del desbordamiento y desconecta su observador", () => {
  let resize: () => void = () => {}; const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect = disconnect; });
  const view = render(<TableRegion label="Tabla"><table><tbody><tr><td>Dato</td></tr></tbody></table></TableRegion>);
  const region = screen.getByRole("region"); Object.defineProperty(region, "scrollWidth", { value: 1000 });
  fireEvent(region, new Event("resize"));
  // The observer reads the actual element dimensions, independently of window resize.
  act(resize);
  expect(screen.getByText(/Desplázate horizontalmente/)).toBeVisible(); view.unmount(); expect(disconnect).toHaveBeenCalledOnce();
});

test("pestañas cambian por teclado y ocultan el panel anterior", async () => {
  const user = userEvent.setup();
  render(<Tabs defaultValue="a"><TabsList aria-label="Vistas"><TabsTrigger value="a">Uno</TabsTrigger><TabsTrigger value="b">Dos</TabsTrigger></TabsList><TabsContent value="a">Primero</TabsContent><TabsContent value="b">Segundo</TabsContent></Tabs>);
  screen.getByRole("tab", { name: "Uno" }).focus(); await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Dos" })).toHaveAttribute("aria-selected", "true"); expect(screen.getByRole("tabpanel")).toHaveTextContent("Segundo");
});

test("diálogo sucio confirma descarte, conserva campos y devuelve el foco", async () => {
  const user = userEvent.setup();
  render(<RecordDialog title="Alta" trigger="Abrir">{controls => <><label>Nombre<input onChange={controls.dirty} /></label><Button onClick={controls.cancel}>Cancelar</Button><Button onClick={controls.close}>Guardar</Button></>}</RecordDialog>);
  await user.click(screen.getByText("Abrir")); await user.type(screen.getByLabelText("Nombre"), "Ficticio");
  const unload = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(unload); expect(unload.defaultPrevented).toBe(true);
  await user.keyboard("{Escape}"); expect(screen.getByRole("alert")).toHaveTextContent("Hay cambios sin guardar");
  await user.click(screen.getByText("Continuar editando")); expect(screen.getByLabelText("Nombre")).toHaveValue("Ficticio");
  await user.click(screen.getByText("Cancelar")); await user.click(screen.getByText("Descartar cambios"));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(screen.getByText("Abrir")).toHaveFocus();
  await user.click(screen.getByText("Abrir")); await user.click(screen.getByRole("button", { name: "Cerrar formulario" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("carga diferida informa espera, renderiza y comunica errores de descarga", async () => {
  let resolve!: (module: { default: () => React.JSX.Element }) => void;
  const Screen = loadScreen(() => new Promise<{ default: () => React.JSX.Element }>(done => { resolve = done; }));
  const view = render(<RouteContent><Screen /></RouteContent>); expect(screen.getByRole("status")).toHaveTextContent("Cargando");
  resolve({ default: () => <h1>Pantalla lista</h1> }); expect(await screen.findByRole("heading")).toHaveTextContent("Pantalla lista"); view.unmount();
  const Broken = loadScreen(async () => { throw new Error("offline"); }); render(<RouteContent><Broken /></RouteContent>);
  expect(await screen.findByRole("alert")).toHaveTextContent("Tus registros locales se conservan"); expect(screen.getByRole("button", { name: "Volver a cargar" })).toBeVisible();
});
