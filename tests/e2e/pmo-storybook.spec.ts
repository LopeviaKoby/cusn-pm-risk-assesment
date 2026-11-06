import {expect, test} from '@playwright/test';
test.use({baseURL: process.env.STORYBOOK_BASE_URL ?? 'http://127.0.0.1:6008'});

test('Storybook: tabla frozen, menús, filtro contextual y peek con foco', async ({page}) => {
  const requests: string[] = []; page.on('request', request => {if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url());});
  for (const theme of ['light', 'dark']) {
    await page.goto(`/iframe.html?id=pmo-operations--dense-portfolio&globals=theme:${theme}`);
    const region = page.getByRole('region', {name: 'Tabla operativa de proyectos'});
    await expect(region).toBeVisible(); const column = region.locator('tbody tr').first().locator('th'); const before = await column.boundingBox(); await region.evaluate(element => {element.scrollLeft = 500;}); const after = await column.boundingBox(); expect(Math.abs(before!.x - after!.x)).toBeLessThan(2);
    await region.getByRole('button', {name: 'Proyecto sintético', exact: true}).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.screenshot({path: `screenshots/pmo-peek-${theme}.png`, fullPage: true}); await page.getByRole('button', {name: 'Cerrar panel'}).click(); await expect(region.getByRole('button', {name: 'Proyecto sintético', exact: true})).toBeFocused();
    await region.locator('thead').getByText('Estado', {exact: true}).click(); await page.getByLabel('Filtrar estado').selectOption('En ejecución'); await expect(region.locator('tbody tr')).toHaveCount(1);
    for (const width of [1440, 390]) for (const zoom of [1, 1.25, 2]) {await page.setViewportSize({width, height: 1000}); await page.evaluate(value => {document.documentElement.style.zoom = String(value);}, zoom); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);}
    await page.setViewportSize({width: 1440, height: 1000}); await page.evaluate(() => {document.documentElement.style.zoom = '1';});
  }
  expect(requests).toEqual([]);
});

test('Storybook: matriz, editor, árbol Drive y agregado analítico en ambos temas', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const theme of ['light', 'dark']) {
    await page.goto(`/iframe.html?id=pmo-operations--monthly-billing&globals=theme:${theme}`); await page.getByRole('button', {name: 'realReportado 2026-01 USD'}).click(); await expect(page.getByRole('status')).toHaveText('2026-01 USD');
    await page.goto(`/iframe.html?id=pmo-operations--billing-editor&globals=theme:${theme}`); await page.getByLabel('Confirmo los importes y el período').check(); await page.getByRole('button', {name: 'Guardar hito'}).click(); await expect(page.getByText('Callback de fixture ejecutado')).toBeVisible();
    await page.goto(`/iframe.html?id=pmo-operations--drive-completed&globals=theme:${theme}`); await expect(page.getByText('Completado')).toBeVisible(); await page.getByLabel('Buscar carpetas cargadas').fill('CIERRE'); await expect(page.getByRole('link', {name: 'CIERRE'})).toBeVisible(); await expect(page.getByRole('link', {name: 'INICIO'})).toHaveCount(0);
    await page.goto(`/iframe.html?id=pmo-operations--analytical-board&globals=theme:${theme}`); await page.getByRole('button', {name: 'En ejecución', exact: true}).click(); await expect(page.getByRole('status')).toContainText('En ejecución'); await page.screenshot({path: `screenshots/pmo-analytics-${theme}.png`, fullPage: true});
  }
  expect(errors).toEqual([]);
});
