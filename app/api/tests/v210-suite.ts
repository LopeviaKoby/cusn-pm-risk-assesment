import {SQL} from 'bun';
import {spawnSync} from 'node:child_process';
import {migrate} from '../scripts/migrate';
import {verifyDatabase} from '../scripts/verify-db';
import {strict as assert} from 'node:assert';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const raw=Bun.env.TEST_DATABASE_URL;
if(Bun.env.NODE_ENV!=='test'||!raw)throw new Error('Requiere NODE_ENV=test y TEST_DATABASE_URL.');
const url=new URL(raw);
if(!['127.0.0.1','localhost'].includes(url.hostname)||!/^\/pmo_test_v210_/.test(url.pathname))throw new Error('Solo base local desechable pmo_test_v210_*.');
if(!Bun.env.TEST_API_DATABASE_URL)throw new Error('La aceptación exige TEST_API_DATABASE_URL con un rol runtime separado.');
const db=new SQL({url:raw,max:1});
try{
  const [existing]=await db<{schema:string|null}>`SELECT to_regnamespace('pmo_cusn')::text AS schema`;
  if(existing?.schema)throw new Error('La suite exige una base nueva; no borra ni reinicia bases.');
  await db`CREATE SCHEMA pmo`;
  await db`CREATE TABLE pmo.sentinel(value text PRIMARY KEY)`;
  await db`INSERT INTO pmo.sentinel VALUES ('intacto')`;
  await migrate(db);await migrate(db);await verifyDatabase(db,false);
  const manifest=JSON.parse(readFileSync('app/api/migrations/manifest.json','utf8')) as {migrations:Array<{file:string;sha256:string}>};
  await db`UPDATE pmo_cusn_meta.migracion SET sha256=repeat('0',64) WHERE version=${manifest.migrations[0]!.file}`;
  try{await assert.rejects(()=>migrate(db),/otro contenido/);}finally{
    await db`UPDATE pmo_cusn_meta.migracion SET sha256=${manifest.migrations[0]!.sha256} WHERE version=${manifest.migrations[0]!.file}`;
  }
  await db`ALTER TABLE pmo_cusn.workspace ADD COLUMN drift_probe text`;
  try{await assert.rejects(()=>migrate(db),/Drift del catálogo/);}finally{
    await db`ALTER TABLE pmo_cusn.workspace DROP COLUMN drift_probe`;
  }
  await db`DROP TRIGGER tr_proteger_baseline_termino ON pmo_cusn.proyecto`;
  await db`DROP FUNCTION pmo_cusn.proteger_baseline_termino()`;
  await db`ALTER TABLE pmo_cusn.proyecto DROP CONSTRAINT ck_proyecto_fecha_termino_actual`;
  await db`DELETE FROM pmo_cusn_meta.migracion WHERE version='012_g1_baseline_guard.sql'`;
  await migrate(db);
  console.log('PASS drift de checksum/catálogo rechazados y upgrade incremental 011→012 verificado.');
}finally{await db.close();}
const password=crypto.randomUUID()+crypto.randomUUID();
const runtime=Bun.env.TEST_API_DATABASE_URL?new URL(Bun.env.TEST_API_DATABASE_URL):null;
if(runtime && (runtime.hostname!==url.hostname||runtime.port!==url.port||runtime.pathname!==url.pathname))throw new Error('Runtime y owner deben usar la misma base aislada.');
const env={...Bun.env,DATABASE_URL:Bun.env.TEST_API_DATABASE_URL??raw,MIGRATOR_DATABASE_URL:raw,TEST_PASSWORD:password,TEST_HEAD_PASSWORD:password,
  ...(runtime?{APP_DB_ROLE:decodeURIComponent(runtime.username),APP_DB_PASSWORD:decodeURIComponent(runtime.password)}:{}),
  JWT_SIGNING_KEY:crypto.randomUUID()+crypto.randomUUID(),APP_ORIGINS:'http://127.0.0.1:4173',COOKIE_SECURE:'false',
  BOOTSTRAP_CONFIRM_DATABASE:url.pathname.slice(1),BOOTSTRAP_HEAD_EMAIL:'head@example.invalid',BOOTSTRAP_HEAD_PASSWORD:password};
const artifacts='.tools/backend-v210-evidence';mkdirSync(artifacts,{recursive:true});
const results:Array<{script:string;exitCode:number|null;output:string}>=[];
for(const script of [...(runtime?['scripts/bootstrap-db','scripts/verify-db']:[]),'scripts/bootstrap-head','tests/auth-smoke','tests/auth-http','tests/auth-negative','tests/workspace-http',
  'tests/projects-http','tests/transfer-http','tests/substitution-http','tests/governance-http','tests/recovery-http','tests/schema-invariants','tests/access-contracts','tests/g1-portfolio-http','tests/projection','tests/tcp-smoke','scripts/generate-models','scripts/export-openapi']){
  const child=spawnSync(process.execPath,[`app/api/${script}.ts`,...(script.startsWith('scripts/generate')||script==='scripts/export-openapi'?['--check']:[])],{env,encoding:'utf8'});
  const output=child.stdout+child.stderr;console.log(output.trim());
  results.push({script,exitCode:child.status,output});
  writeFileSync(artifacts+'/results.json',JSON.stringify({at:new Date().toISOString(),database:url.pathname.slice(1),runtime:runtime?.username,results},null,2));
  if(child.status!==0)throw new Error(`Falló ${script}`);
}
console.log('PASS suite v2.1.0 en base nueva.');
