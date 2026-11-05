import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { GplPage } from "./pages/GplPage";
import projects from "../../src/demo/data/core/projects.json" with { type: "json" };

test("@smoke acceso, retorno, navegación e historial", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const app = new GplPage(page);
  await app.login("/portafolio?vista=finanzas");
  await expect(page.getByRole("tab", { name: "Finanzas", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Proyectos" }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
  await page.goBack(); await expect(page).toHaveURL(/vista=finanzas/);
  await page.reload(); await expect(page.getByRole("tab", { name: "Finanzas", exact: true })).toHaveAttribute("aria-selected", "true");
  await app.open(`/proyectos/${projects[0]!.id}/resumen`);
  await expect(page.getByRole("heading", { name: projects[0]!.name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("@critical diálogo conserva cambios, confirma descarte y devuelve foco", async ({ page }) => {
  const app = new GplPage(page); await app.login("/proyectos");
  const trigger = page.getByRole("button", { name: "Nuevo proyecto" }); await trigger.click();
  const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nombre del proyecto", { exact: true }).fill("Proyecto ficticio de prueba");
  await page.keyboard.press("Escape");
  await expect(dialog.getByText("Hay cambios sin guardar.")).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar editando" }).click();
  await expect(dialog.getByLabel("Nombre del proyecto", { exact: true })).toHaveValue("Proyecto ficticio de prueba");
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  await dialog.getByRole("button", { name: "Descartar cambios" }).click();
  await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
});

test("@regression pestañas se operan por teclado y conservan URL", async ({ page }) => {
  const app = new GplPage(page); await app.login("/portafolio");
  const tab = page.getByRole("tab", { name: "Visión general", exact: true }); await tab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Finanzas", exact: true })).toBeFocused();
  await expect(page).toHaveURL(/vista=finanzas/);
});

test("@critical alta manual persiste al recargar sin escribir fixtures", async ({ page }) => {
  const app = new GplPage(page); await app.login("/proyectos");
  await page.getByRole("button", { name: "Nuevo proyecto" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Identificador único", { exact: true }).fill("PRJ-E2E-LOCAL");
  await dialog.getByLabel("Nombre del proyecto", { exact: true }).fill("Proyecto E2E ficticio");
  for (const label of ["Cliente", "País", "Línea de negocio (LOB)"]) {
    const select = dialog.getByRole("combobox", { name: label, exact: true });
    const value = await select.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value).find(Boolean));
    await select.selectOption(value!);
  }
  await dialog.getByRole("button", { name: "Crear proyecto", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Proyecto E2E ficticio", exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole("heading", { name: "Proyecto E2E ficticio", exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("gpl.demo.records.v1")!).version)).toBe(2);
});

for (const path of ["/workspace", "/proyectos", "/riesgos", "/portafolio?vista=finanzas"]) {
  test(`@a11y ${path}`, async ({ page }) => {
    const app = new GplPage(page); await app.login(path);
    await expect(page.locator("#contenido h1")).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(result.violations).toEqual([]);
  });
}

test("@visual equivalencia de pantallas desktop y móvil", async ({ page }) => {
  const app = new GplPage(page); await app.login();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, path] of [["workspace", "/workspace"], ["projects", "/proyectos"], ["risks", "/riesgos"], ["finance", "/portafolio?vista=finanzas"]]) {
      await app.open(path!); await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, { animations: "disabled", maxDiffPixelRatio: 0.005 });
    }
  }
});
