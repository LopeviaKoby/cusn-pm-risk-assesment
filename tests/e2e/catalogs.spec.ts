import { expect, test } from '@playwright/test';

test('fixtures de catálogos: selección, modal, foco y reflow Light/Dark sin requests API', async ({ page }) => {
  const apiRequests: string[] = [], errors: string[] = [], missing: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) missing.push(response.url()); });
  for (const theme of ['light', 'dark']) {
    await page.goto(`/iframe.html?id=catalog-fixtures--contextual&globals=theme:${theme}`);
    await page.getByLabel(/^TVT/).fill('TVT-CONSERVADO');
    await page.getByLabel(/^Nombre del proyecto/).fill('Proyecto conservado');
    for (const [field, name] of [['País', 'Chile'], ['LOB', 'Cloud solutions'], ['PM titular', 'PM de prueba']]) {
      await page.getByLabel(new RegExp('^' + field)).click();
      await page.getByRole('group', { name: 'Opciones de ' + field }).getByRole('button', { name: new RegExp(name!) }).click();
    }
    for (const width of [1440, 390]) for (const zoom of [1, 2]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
      await page.getByLabel(/^Cliente/).click();
      await page.getByLabel('Buscar cliente…').fill('Empresa nueva');
      const panel = page.getByRole('group', { name: 'Opciones de Cliente' });
      await expect(panel.getByText('No hay coincidencias', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if (width === 1440 && zoom === 1) await page.screenshot({ path: `screenshots/catalog-dropdown-${theme}.png`, fullPage: true });
      await panel.getByRole('button', { name: 'Agregar registro' }).click();
      const dialog = page.getByRole('dialog', { name: 'Agregar cliente' });
      await expect(dialog.getByLabel('Nombre del cliente *')).toHaveValue('Empresa nueva');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if (width === 1440 && zoom === 1) await page.screenshot({ path: `screenshots/catalog-client-modal-${theme}.png`, fullPage: true });
      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(page.getByLabel(/^Cliente/)).toBeFocused();
      await expect(page.getByLabel(/^TVT/)).toHaveValue('TVT-CONSERVADO');
    }
    await page.evaluate(() => { document.documentElement.style.zoom = '1'; });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByLabel(/^Cliente/).click();
    await page.getByRole('button', { name: 'Agregar registro' }).click();
    await page.getByRole('button', { name: 'Guardar cliente' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel(/^Cliente/)).toContainText('Empresa nueva');
    await expect(page.getByLabel(/^País/)).toContainText('Chile');
    await expect(page.getByLabel(/^LOB/)).toContainText('Cloud solutions');
    await expect(page.getByLabel(/^PM titular/)).toContainText('PM de prueba');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/iframe.html?id=catalog-fixtures--client-service-unavailable&globals=theme:dark');
  await page.getByRole('button', { name: 'Guardar cliente' }).click();
  await expect(page.getByText('No pudimos guardar el cliente. Inténtalo más tarde.')).toBeVisible();
  expect(apiRequests).toEqual([]); expect(errors).toEqual([]); expect(missing).toEqual([]);
});

test('Recharts 3 renderiza líneas con React 19 y tokens en Light/Dark; vacío sin curvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['light', 'dark']) {
    await page.goto(`/iframe.html?id=progress-fixtures--synthetic-series&globals=theme:${theme}`);
    for (const width of [1440, 390]) for (const zoom of [1, 2]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
      await expect(page.locator('.recharts-line-curve')).toHaveCount(2);
      const strokes = await page.locator('.recharts-line-curve').evaluateAll(lines => lines.map(line => getComputedStyle(line).stroke));
      expect(strokes[0]).not.toBe(strokes[1]);
      expect(strokes.every(stroke => stroke !== 'none')).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if (width === 1440 && zoom === 1) await page.screenshot({ path: `screenshots/progress-chart-${theme}.png`, fullPage: true });
    }
    await page.goto(`/iframe.html?id=progress-fixtures--unavailable-series&globals=theme:${theme}`);
    await expect(page.getByText('Serie de avance no disponible')).toBeVisible();
    await expect(page.locator('.recharts-line-curve')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
