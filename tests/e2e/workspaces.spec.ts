import { test, expect } from '@playwright/test';

test('onboarding y home Light/Dark conservan reflow y no consultan bootstrap', async ({ page }) => {
  const calls: string[] = [];
  const spaces: {id:string;nombre:string;slug:string;version:string}[] = [];
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    calls.push(path);
    let data: unknown;
    if(path === '/api/v1/sesion') data={identifier:'persona@example.test',expiresAt:'2099-01-01T00:00:00Z',role:'PM',permissions:['workspaces.consultar','workspaces.crear']};
    else if(path === '/api/v1/workspaces') {
      if(route.request().method()==='POST') {
        expect(route.request().postDataJSON()).toEqual({nombre:'Equipo de pruebas'});
        spaces.push({id:'15',nombre:'Equipo de pruebas',slug:'equipo-pruebas',version:'1'});data=spaces[0];
      } else data=spaces;
    } else { await route.fulfill({status:500,json:{error:{message:'Bootstrap retirado'}}}); return; }
    await route.fulfill({status:route.request().method()==='POST'?201:200,json:{data}});
  });
  await page.goto('/workspace');
  await expect(page.getByLabel('Nombre del workspace')).toBeVisible();
  for(const width of [1280,1440,390]) {
    await page.setViewportSize({width,height:900});
    for(const zoom of [1,2]) {
      await page.evaluate(value=>{document.documentElement.style.zoom=String(value);},zoom);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
    }
  }
  await page.evaluate(()=>{document.documentElement.style.zoom='1';});
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:'screenshots/workspace-create-light.png'});
  await page.getByRole('button',{name:'Cambiar tema'}).click();
  await page.screenshot({path:'screenshots/workspace-create-dark.png'});
  await page.getByLabel('Nombre del workspace').fill('  Equipo de pruebas  ');
  await page.getByRole('button',{name:'Crear workspace',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Te damos la bienvenida a Equipo de pruebas'})).toBeVisible();
  await page.screenshot({path:'screenshots/workspace-home-dark.png'});
  expect(calls).not.toContain('/api/v1/datos');
});
