import {SQL} from 'bun';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export async function catalogHash(db:SQL){
  await db`SELECT set_config('search_path','pg_catalog',true)`;
  const columns=await db`SELECT table_name,column_name,udt_name,is_nullable,is_identity,is_generated,column_default,
    generation_expression,character_maximum_length,numeric_precision,numeric_scale,datetime_precision
    FROM information_schema.columns WHERE table_schema='pmo_cusn' ORDER BY table_name,ordinal_position`;
  const constraints=await db`SELECT c.relname,r.conname,r.contype,pg_get_constraintdef(r.oid) definition
    FROM pg_constraint r JOIN pg_class c ON c.oid=r.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='pmo_cusn' ORDER BY c.relname,r.conname`;
  const indexes=await db`SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='pmo_cusn' ORDER BY tablename,indexname`;
  const functions=await db`SELECT p.proname,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='pmo_cusn' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.objid=p.oid AND d.deptype='e') ORDER BY p.proname`;
  const triggers=await db`SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid) definition FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='pmo_cusn' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`;
  const roles=await db`SELECT codigo,nombre,activo FROM pmo_cusn.rol ORDER BY codigo`;
  const permissions=await db`SELECT codigo,descripcion,delegable FROM pmo_cusn.permiso ORDER BY codigo`;
  const grants=await db`SELECT r.codigo role,p.codigo permission FROM pmo_cusn.rol_permiso rp
    JOIN pmo_cusn.rol r ON r.id=rp.rol_id JOIN pmo_cusn.permiso p ON p.id=rp.permiso_id ORDER BY r.codigo,p.codigo`;
  return createHash('sha256').update(JSON.stringify({columns,constraints,indexes,functions,triggers,roles,permissions,grants})).digest('hex');
}
export async function assertCatalog(db:SQL,expected?:string){
  const manifest=JSON.parse(readFileSync(resolve(import.meta.dirname,'../migrations/manifest.json'),'utf8')) as {catalogSha256:string};
  const actual=await catalogHash(db);
  if(!(expected??manifest.catalogSha256)||actual!==(expected??manifest.catalogSha256))throw new Error('Drift del catálogo v2.1.0; no se generan modelos ni se acepta la migración.');
}
if(import.meta.main){
  const db=new SQL({url:Bun.env.MIGRATOR_DATABASE_URL,max:1});
  try{console.log(await db.begin(tx=>catalogHash(tx)));}finally{await db.close();}
}
