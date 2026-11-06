import {expect, test, type Page} from '@playwright/test';
import {billingFixture, driveFixture, portfolioFixture, projectFixture} from '../../app/src/stories/catalogs/pmo-fixtures';

async function mockApi(page: Page, options: {readonly?: boolean; conflict?: boolean} = {}) {
  let project = structuredClone(projectFixture), line = structuredClone(billingFixture.hitos[0]!); const calls: {method: string; path: string; body: unknown}[] = [];
  const permissions = options.readonly ? ['proyectos.consultar', 'workspaces.consultar'] : ['proyectos.consultar', 'proyectos.crear', 'clientes.crear', 'proyectos.editar', 'facturacion.reportar', 'workspaces.consultar'];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), method = route.request().method(), body = route.request().postDataJSON(); calls.push({method, path: url.pathname + url.search, body}); let data: unknown;
    if (url.pathname === '/api/v1/sesion') data = {identifier: 'fixture@example.invalid', expiresAt: '2099-01-01T00:00:00Z', role: options.readonly ? 'VISUALIZADOR' : 'ADMIN', permissions};
    else if (url.pathname === '/api/v1/workspaces') data = [project.identidad.workspace];
    else if (url.pathname === '/api/v1/clientes' && method === 'POST') {await route.fulfill({status: 201, json: {data: {id: '9007199254740996', ...body, sector: null}}}); return;}
    else if (url.pathname === '/api/v1/clientes') data = {items: url.searchParams.get('q') ? [] : [project.identidad.cliente], paginacion: {limit: 100, total: 1, hasMore: false, nextCursor: null}};
    else if (url.pathname === '/api/v1/paises') data = [project.identidad.pais];
    else if (url.pathname === '/api/v1/lobs') data = [project.identidad.lob];
    else if (url.pathname.endsWith('/elegibles')) data = {items: [{usuarioId: '30', nombre: 'PM sintético', email: 'fixture@example.invalid', rol: url.searchParams.get('para') === 'ESPECIALISTA' ? 'ESPECIALISTA' : 'PM', tipoUsuario: 'INTERNO', miembroActivo: true, puedeCrearProyectos: true}]};
    else if (url.pathname === '/api/v1/portafolio') {const offset = Number(url.searchParams.get('offset') ?? 0), state = url.searchParams.get('estado'); const rows = Array.from({length: offset ? 11 : 50}, (_, i) => ({...portfolioFixture.items[0]!, id: i === 0 && !offset ? project.id : String(offset + i + 100), nombre: i === 0 && !offset ? project.nombre : `Proyecto de página ${offset + i}`, estado: state ?? 'Requiere P1P2'})); data = {...portfolioFixture, items: rows, paginacion: {...portfolioFixture.paginacion, offset, hasMore: !offset, nextOffset: offset ? null : 50}};}
    else if (/\/workspaces\/12\/proyectos$/.test(url.pathname)) data = {...portfolioFixture, items: [{...portfolioFixture.items[0], workspaceId: '12'}]};
    else if (url.pathname === '/api/v1/proyectos' && method === 'POST') {project = {...project, ...body, identidad: {...project.identidad, nombre: body.nombre, cliente: {...project.identidad.cliente, id: body.clienteId}}, condicionComercial: body.condicionComercial, planificacion: {...project.planificacion, fechaInicio: body.fechaInicio, fechaTerminoBaseline: body.fechaTerminoBaseline}}; await route.fulfill({status: 201, json: {data: project}}); return;}
    else if (url.pathname.endsWith('/inicio')) {if (project.estado !== 'Requiere P1P2' || options.conflict) {await route.fulfill({status: 409, json: {error: {code: 'START_CONFLICT', message: 'Ya iniciado o versión obsoleta'}}}); return;} project = {...project, estado: 'En ejecución', version: '3', planificacion: {...project.planificacion, fechaInicioReal: '2026-11-06'}}; data = project;}
    else if (url.pathname.endsWith('/facturacion/indicadores')) data = {proyectoId: project.id, corte: '2026-12', estado: 'SIN_HITOS_EXIGIBLES', porMoneda: [{unidadCodigo: 'USD', valor: null, estado: 'SIN_HITOS_EXIGIBLES'}]};
    else if (url.pathname.endsWith('/facturacion')) data = {...billingFixture, hitos: [line]};
    else if (url.pathname.includes('/facturacion/hitos')) {if (options.readonly || options.conflict) {await route.fulfill({status: options.readonly ? 403 : 409, json: {error: {code: 'CONFLICT', message: 'Versión de hito obsoleta'}}}); return;} line = {...line, ...body, version: '2'}; data = line;}
    else if (url.pathname.endsWith('/drive/carpetas')) data = driveFixture;
    else if (url.pathname === `/api/v1/proyectos/${project.id}`) {if (method === 'PATCH') {if (options.conflict) {await route.fulfill({status: 409, json: {error: {code: 'VERSION_CONFLICT', message: 'Proyecto modificado'}}}); return;} project = {...project, nombre: body.nombre, version: '3'};} data = {...project, accionesDisponibles: {...project.accionesDisponibles, puedeEditarFicha: !options.readonly}};}
    else throw new Error('Endpoint no autorizado por fixture: ' + url.pathname);
    await route.fulfill({json: {data}});
  });
  return calls;
}

test('flujo 1.1 simulado: cliente clasificado, TCV, fechas, ficha e inicio versionado', async ({page}) => {
  const calls = await mockApi(page); await page.goto('/workspace/12/proyectos/nuevo');
  await page.getByLabel(/^TVT/).fill('TVT-FLOW'); await page.getByLabel(/^Nombre del proyecto/).fill('Proyecto de flujo');
  await page.getByLabel(/^Cliente/).click(); await page.getByLabel('Buscar cliente…').fill('Nuevo cliente');
  await page.getByRole('button', {name: 'Agregar registro'}).click(); const dialog = page.getByRole('dialog', {name: 'Agregar cliente'});
  await dialog.getByLabel('Clasificación del cliente *').selectOption('ANTIGUO'); await dialog.getByRole('button', {name: 'Guardar cliente'}).click(); await expect(dialog).toHaveCount(0);
  for (const [label, name] of [['País', 'Chile'], ['LOB', 'LOB sintética'], ['PM titular', 'PM sintético']]) {await page.getByLabel(new RegExp('^' + label)).click(); await page.getByRole('group', {name: 'Opciones de ' + label}).getByRole('button', {name: new RegExp(name!)}).click();}
  await page.getByLabel(/^Inicio planificado/).fill('2026-01-01'); await page.getByLabel(/^Término baseline/).fill('2026-12-31'); await page.getByLabel('Valor TCV *').fill('100000.1234'); await page.getByLabel('Moneda (código de 3 letras) *').fill('USD');
  await page.getByRole('button', {name: 'Crear proyecto', exact: true}).click(); await expect(page.getByRole('heading', {name: 'Proyecto de flujo'})).toBeVisible();
  await page.getByRole('button', {name: 'Iniciar ejecución'}).click(); await expect(page.getByRole('button', {name: 'Iniciar ejecución'})).toHaveCount(0); await expect(page.getByText('2026-11-06', {exact: true}).first()).toBeVisible();
  expect(calls.find(call => call.path === '/api/v1/clientes' && call.method === 'POST')?.body).toEqual({nombre: 'Nuevo cliente', estadoCliente: 'ANTIGUO'});
  expect(calls.filter(call => call.path.endsWith('/inicio'))).toHaveLength(1); expect(calls.some(call => /\/datos|\/catalogos/.test(call.path))).toBe(false);
});

test('portafolio simulado: >50 registros, filtros/orden URL, peek y edición inline versionada', async ({page}) => {
  const calls = await mockApi(page); await page.goto('/portafolio'); await expect(page.getByRole('heading', {name: 'Portafolio', exact: true})).toBeVisible();
  await expect(page.getByText('Página recibida: 50 de 61')).toBeVisible(); await page.getByRole('button', {name: 'Página siguiente'}).click(); await expect(page.getByText('Página recibida: 11 de 61')).toBeVisible();
  await page.getByRole('button', {name: 'Página anterior'}).click(); const region = page.getByRole('region', {name: 'Tabla operativa de proyectos'});
  await region.getByRole('button', {name: projectFixture.nombre, exact: true}).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button', {name: 'Cerrar panel'}).click();
  await region.getByRole('button', {name: 'Editar nombre', exact: true}).click(); await region.getByLabel('Editar nombre del proyecto').fill('Nombre editado'); await region.getByRole('button', {name: 'Guardar', exact: true}).click();
  await expect.poll(() => calls.some(call => call.method === 'PATCH' && (call.body as {nombre?: string})?.nombre === 'Nombre editado')).toBe(true);
  await page.getByRole('button', {name: 'Tablero analítico PMO'}).click(); await page.getByRole('button', {name: 'En ejecución', exact: true}).first().click(); await expect(page).toHaveURL(/estado=En\+ejecuci/);
  expect(calls.some(call => call.path.includes('offset=50'))).toBe(true); expect(calls.some(call => /\/datos|\/catalogos/.test(call.path))).toBe(false);
});

test('facturación simulada: matriz, detalle, edición exacta, CPI null y Documentos', async ({page}) => {
  const calls = await mockApi(page); await page.goto(`/workspace/12/proyectos/${projectFixture.id}/facturacion`);
  await page.getByRole('button', {name: 'realReportado 2026-01 USD'}).click(); await page.getByRole('button', {name: 'Editar hito 50'}).click();
  await page.getByRole('dialog').getByLabel('Real reportado', {exact: true}).fill('9000.0001'); await page.getByLabel('Confirmo los importes y el período').check(); await page.getByRole('button', {name: 'Guardar hito'}).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(calls.find(call => call.method === 'PATCH' && call.path.includes('/facturacion/hitos'))?.body).toMatchObject({realReportado: '9000.0001', claveRegistro: billingFixture.hitos[0]!.claveRegistro, version: '1'});
  await expect(page.getByText(/Sin valor calculable/)).toBeVisible(); await page.getByRole('link', {name: 'Documentos', exact: true}).click(); await expect(page.getByText('Completado', {exact: true})).toBeVisible(); await expect(page.getByRole('link', {name: 'INICIO', exact: true})).toHaveAttribute('rel', 'noopener noreferrer');
});

test('409 financiero conserva editor; perfil sin permiso no tiene acciones efectivas', async ({page}) => {
  await mockApi(page, {conflict: true}); await page.goto(`/workspace/12/proyectos/${projectFixture.id}/facturacion`); await page.getByRole('button', {name: 'realReportado 2026-01 USD'}).click(); await page.getByRole('button', {name: 'Editar hito 50'}).click(); await page.getByLabel('Confirmo los importes y el período').check(); await page.getByRole('button', {name: 'Guardar hito'}).click(); await expect(page.getByText(/Versión de hito obsoleta/)).toBeVisible(); await expect(page.getByRole('dialog').getByLabel('Showprice', {exact: true})).toHaveValue('10000.1234');
  await page.unroute('**/api/**'); await mockApi(page, {readonly: true}); await page.goto(`/workspace/12/proyectos/${projectFixture.id}/facturacion`); await expect(page.getByRole('heading', {name: 'Facturación', exact: true})).toBeVisible(); await expect(page.getByRole('button', {name: 'Nuevo hito manual'})).toHaveCount(0); await expect(page.getByRole('button', {name: 'Iniciar ejecución'})).toHaveCount(0);
});

test('portafolio y finanzas Light/Dark: 125/200%, scroll contenido, panel y sin errores JS', async ({page}) => {
  await mockApi(page); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const view of ['portafolio', `workspace/12/proyectos/${projectFixture.id}/facturacion`]) for (const theme of ['light', 'dark']) {
    await page.goto('/' + view); if (theme === 'dark') await page.getByRole('button', {name: 'Cambiar tema'}).click();
    await expect(page.getByRole('table').first()).toBeVisible();
    for (const width of [1440, 390]) for (const zoom of [1, 1.25, 2]) {await page.setViewportSize({width, height: 1000}); await page.evaluate(value => {document.documentElement.style.zoom = String(value);}, zoom); const overflow = await page.evaluate(() => ({ok: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, elements: [...document.querySelectorAll('main *, header *')].filter(element => !element.closest('.pmo-dense-region')).filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 15).map(element => ({tag: element.tagName, css: element.className, text: element.textContent?.slice(0, 60), right: element.getBoundingClientRect().right}))})); expect(overflow.ok, `${view}/${theme}/${width}/${zoom}: ${JSON.stringify(overflow.elements)}`).toBe(true);}
    await page.setViewportSize({width: 1440, height: 1000}); await page.evaluate(() => {document.documentElement.style.zoom = '1';}); await page.screenshot({path: `screenshots/pmo-${view === 'portafolio' ? 'portfolio' : 'billing'}-${theme}.png`, fullPage: true});
  }
  expect(errors).toEqual([]);
});
