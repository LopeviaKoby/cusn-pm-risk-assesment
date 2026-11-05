import { expect, type Page } from "@playwright/test";

export class GplPage {
  constructor(readonly page: Page) {}
  async login(destination = "/workspace") {
    await this.page.goto(destination);
    await expect(this.page.getByLabel("Identificación", { exact: true }).or(this.page.locator("#contenido"))).toBeVisible();
    if (await this.page.getByLabel("Identificación", { exact: true }).isVisible()) {
      await this.page.getByLabel("Identificación", { exact: true }).fill("pm@gpl.example.test");
      await this.page.getByLabel("Contraseña", { exact: true }).fill("GPL-local-2026!");
      await this.page.getByRole("button", { name: "Entrar a mi espacio" }).click();
    }
    await expect(this.page.locator("#contenido")).toBeVisible();
  }
  async open(path: string) {
    await this.page.goto(path);
    await expect(this.page.locator("#contenido")).toBeVisible();
    await expect(this.page.locator("#contenido h1")).toBeVisible();
    await expect(this.page.getByText("Cargando…", { exact: true })).toHaveCount(0);
  }
}
