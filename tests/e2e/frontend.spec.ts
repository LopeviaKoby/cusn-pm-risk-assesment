import { expect, test } from "@playwright/test";

test("sin API, la aplicación muestra un error de sesión y no datos sintéticos", async ({ page }) => {
  await page.route("**/api/**", route => route.abort("failed"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  await page.getByRole("textbox", { name: "Identificación" }).fill("fixture@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("fixture-password-only");
  await page.getByRole("button", { name: "Entrar a mi espacio" }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo verificar la sesión");
  await expect(page.getByText("Proyectos recientes")).toHaveCount(0);
});
