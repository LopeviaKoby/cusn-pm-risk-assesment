import { expect, test } from '@playwright/test';

test('listado, formulario bloqueado y ficha 360 sin endpoints retirados ni contenido ficticio', async ({ page }) => {
  const unexpected: string[] = [], errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const project = { id: '9007199254740994', workspaceId: '12', tvt: 'TVT-TEST', nombre: 'Proyecto de pruebas', version: '1', estado: 'p1p2-required' };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()); let data: unknown;
    if (url.pathname === '/api/v1/sesion') data = { identifier: 'fixture@example.invalid', expiresAt: '2099-01-01T00:00:00Z', role: 'ADMIN', permissions: ['workspaces.consultar', 'proyectos.consultar', 'proyectos.crear'] };
    else if (url.pathname === '/api/v1/workspaces') data = [{ id: '12', nombre: 'Workspace de pruebas', slug: 'workspace-test', version: '1' }];
    else if (url.pathname === '/api/v1/proyectos' && route.request().method() === 'GET') data = [project];
    else if (url.pathname === `/api/v1/proyectos/${project.id}`) data = project;
    else { unexpected.push(route.request().method() + ' ' + url.pathname); await route.fulfill({ status: 404, json: { error: { message: 'Endpoint no permitido' } } }); return; }
    await route.fulfill({ status: 200, json: { data } });
  });
  await page.goto('/workspace/12/proyectos');
  await expect(page.getByRole('heading', { name: 'Proyectos', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Nuevo proyecto', exact: true }).click();
  await expect(page.getByLabel(/^TVT/)).toBeVisible();
  await expect(page.getByLabel(/^PM titular/)).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Crear proyecto', exact: true })).toBeDisabled();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Cambiar tema' }).click();
    for (const width of [1280, 1440, 1920, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const zoom of [1, 2]) {
        await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `form ${theme}/${width}/${zoom}`).toBe(true);
      }
    }
    await page.evaluate(() => { document.documentElement.style.zoom = '1'; });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: `screenshots/project-create-${theme}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('link', { name: /TVT-TEST.*Proyecto de pruebas/ }).last().click();
  await expect(page.getByRole('heading', { name: 'Curva S', exact: true })).toBeVisible();
  await expect(page.getByText('Requiere P1P2', { exact: true })).toBeVisible();
  const positions = await page.getByRole('navigation', { name: 'Secciones del proyecto' }).getByRole('link').evaluateAll(links => links.map(link => link.getBoundingClientRect().top));
  expect(new Set(positions).size).toBe(1);
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.getByRole('button', { name: 'Cambiar tema' }).click();
    for (const width of [1280, 1440, 1920, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const zoom of [1, 2]) {
        await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `dashboard ${theme}/${width}/${zoom}`).toBe(true);
      }
    }
    await page.evaluate(() => { document.documentElement.style.zoom = '1'; });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: `screenshots/project-overview-${theme}.png`, fullPage: true });
  }
  await page.getByRole('link', { name: 'Seguimiento', exact: true }).click();
  await expect(page.getByText('Aún no disponible en v2.1.0', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Seguimiento', exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('link', { name: 'Proyectos', exact: true }).first().click();
  await page.getByRole('link', { name: 'Nuevo proyecto', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nuevo proyecto', exact: true })).toBeVisible();
  expect(unexpected).toEqual([]); expect(errors).toEqual([]);
});
