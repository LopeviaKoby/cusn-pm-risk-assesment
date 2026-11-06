import {strict as assert} from 'node:assert';
import {SQL} from 'bun';
import {drizzle} from 'drizzle-orm/bun-sql';
import {eq} from 'drizzle-orm';
import {proyecto,condicion_comercial} from '../src/infrastructure/database/schema';
if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const fixture=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const large='9007199254740993';
const [source]=await fixture<{workspace:string;owner:string;client:string;country:string;lob:string}>`
  SELECT p.workspace_id::text workspace,pp.usuario_id::text owner,p.cliente_id::text client,p.pais_id::text country,p.lob_id::text lob
  FROM pmo_cusn.proyecto p JOIN pmo_cusn.participacion_proyecto pp ON pp.proyecto_id=p.id
    AND pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL ORDER BY p.id LIMIT 1`;
assert.ok(source);
await fixture.begin(async tx=>{
  await tx`INSERT INTO pmo_cusn.proyecto(id,tvt,nombre,workspace_id,creado_por_id,cliente_id,pais_id,lob_id,fecha_inicio)
    OVERRIDING SYSTEM VALUE VALUES (${large},'PRECISION-TEST','Precisión',${source.workspace},${source.owner},${source.client},${source.country},${source.lob},'2026-11-05')`;
  await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion) VALUES (${large},${source.owner},'PM_TITULAR')`;
});
const {findProject}=await import('../src/repositories/projects');
const {closeDatabase}=await import('../src/db');
try{
  assert.equal((await findProject(large))?.id,large);
  const orm=drizzle(fixture);
  const [row]=await orm.select().from(proyecto).where(eq(proyecto.id,BigInt(large)));
  assert.equal(row?.id,9007199254740993n);assert.equal(row.fecha_inicio,'2026-11-05');assert.equal(row.fecha_termino_actual,null);
  assert.equal(row.tvt_normalizado,'PRECISION-TEST');assert.ok(row.created_at instanceof Date);
  const [money]=await orm.insert(condicion_comercial).values({proyecto_id:BigInt(large),tcv_tipo:'DEFINIDO',tcv_valor:'900719925474099.1234',unidad_codigo:'USD'}).returning();
  assert.equal(money?.tcv_valor,'900719925474099.1234');
  await assert.rejects(()=>orm.update(condicion_comercial).set({tcv_tipo:'ILIMITADO',tcv_valor:null,unidad_codigo:null}).where(eq(condicion_comercial.proyecto_id,BigInt(large))));
  const [empty]=await orm.select().from(condicion_comercial).where(eq(condicion_comercial.proyecto_id,BigInt(large)));
  assert.equal(empty?.tcv_valor,'900719925474099.1234');
  console.log('PASS Drizzle lectura/escritura: bigint > MAX_SAFE_INTEGER, numeric exacto, NULL, date, UTC y columna generada.');
}finally{await fixture.close();await closeDatabase();}
