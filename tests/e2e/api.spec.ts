import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.skip(process.env.GPL_API_TEST!=="1","Solo con backend y fixtures PostgreSQL aislados de test:db.");

test('@critical vistas conectadas de complejidad, compras y aprobaciones',async({page})=>{
  await page.goto('/complejidad');
  await page.getByLabel('Identificación',{exact:true}).fill('fixture@example.invalid');
  await page.getByLabel('Contraseña',{exact:true}).fill('fixture-password-only');
  await page.getByRole('button',{name:'Entrar a mi espacio'}).click();
  await expect(page.getByRole('heading',{name:'Complejidad',exact:true})).toBeVisible();
  await page.getByRole('slider',{name:'Riesgo',exact:true}).fill('5');
  await expect(page.getByText('IC 2.4')).toBeVisible();
  await page.getByRole('link',{name:'Compras',exact:true}).click();
  await page.getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Monto adjudicado · cero válido').fill('0');
  await expect(page.getByText(/100 % del presupuesto/)).toBeVisible();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await expect(page.getByText('Hay cambios sin guardar.')).toBeVisible();
  await page.getByRole('button',{name:'Descartar cambios',exact:true}).click();
  await page.getByRole('link',{name:/Aprobaciones/}).click();
  await expect(page.getByRole('heading',{name:'Aprobaciones',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Navegación principal'}).getByText(/Horas|Repases|Asignaciones/)).toHaveCount(0);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
});

test("@critical proyectos y riesgos usan pmo_cusn con edición persistida",async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/proyectos');
  await page.getByLabel('Identificación',{exact:true}).fill('fixture@example.invalid');
  await page.getByLabel('Contraseña',{exact:true}).fill('fixture-password-only');
  await page.getByRole('button',{name:'Entrar a mi espacio'}).click();
  await expect(page.getByRole('heading',{name:'Proyectos',exact:true})).toBeVisible();
  await expect(page.getByText('Proyecto ajeno',{exact:true})).toHaveCount(0);
  const table=page.getByRole('table').first();
  await expect(table.getByText(/Editado HTTP/)).toBeVisible();
  await table.getByRole('button',{name:'Editar Editado HTTP',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Término previsto',{exact:true})).toHaveCount(0);
  await page.getByLabel('Proyecto',{exact:true}).fill('Editado navegador');
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(/Editado navegador/)).toBeVisible();
  const a11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
  await page.screenshot({path:'.tools/pmo-v200-projects.png',fullPage:true});
  await page.goto('/proyectos/9007199254740993/riesgos');
  await expect(page.getByText('Riesgo fixture',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Editar Riesgo fixture',exact:true}).click();
  await expect(page.getByLabel('Probabilidad (1-4)',{exact:true})).toHaveAttribute('max','4');
  expect(errors).toEqual([]);
});
