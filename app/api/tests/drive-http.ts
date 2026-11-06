import {spawnSync} from 'node:child_process';
import {strict as assert} from 'node:assert';
import {SQL} from 'bun';
import {provisionDrive} from '../src/application/drive/provision';
import {DriveFailure,type DriveAdapter,type DriveFolder} from '../src/application/drive/adapter';
import {config} from '../src/config';
import tree from '../src/application/drive/tree.json';
if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});const {sql,closeDatabase}=await import('../src/db');const {handleRequest}=await import('../src/index');
const request=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request('http://127.0.0.1/api/v1/'+path,{method,headers:{origin:'http://127.0.0.1:4173',...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));
async function data(r:Response,status=200){const b=await r.json();assert.equal(r.status,status,JSON.stringify(b));return b.data;}
class Fake implements DriveAdapter {
 items=new Map<string,DriveFolder>();creates=0;timeoutOnce=false;fail=false;delay=0;
 async get(id:string){const f=this.items.get(id);if(!f)throw new DriveFailure('NOT_FOUND');return f;}
 async find(parent:string,job:string,key:string){return [...this.items.values()].filter(f=>f.parents.includes(parent)&&f.appProperties.pmoJob===job&&f.appProperties.pmoNode===key);}
 async create(parent:string,name:string,job:string,key:string){
  if(this.delay)await new Promise(r=>setTimeout(r,this.delay));
  if(this.fail)throw new DriveFailure('PERMISSION_DENIED');
  const f={id:'fake-'+crypto.randomUUID(),name,parents:[parent],mimeType:'application/vnd.google-apps.folder',trashed:false,appProperties:{pmoJob:job,pmoNode:key}};this.items.set(f.id,f);this.creates++;
  if(this.timeoutOnce){this.timeoutOnce=false;throw new DriveFailure('REMOTE_UNCERTAIN',true);}return f;
 }
}
try{
 const disabledWorker=spawnSync(process.execPath,['app/api/scripts/drive-worker.ts'],{env:{...process.env,DRIVE_PROVISIONING_ENABLED:'false'},encoding:'utf8'});assert.notEqual(disabledWorker.status,0);assert.ok(disabledWorker.stderr.includes('Ejecutor desactivado'));
 const login=await request('POST','sesion',undefined,{identifier:'pm-workspace@example.invalid',password:Bun.env.TEST_PASSWORD});await data(login);const cookie=login.headers.getSetCookie().find(c=>c.startsWith('pmo_access='))!.split(';')[0]!;
 const workspace=await data(await request('POST','workspaces',cookie,{nombre:'Drive ensayo '+crypto.randomUUID()}),201);
 const [source]=await db<{clienteId:string;paisId:string;lobId:string}>`SELECT cliente_id::text AS "clienteId",pais_id::text AS "paisId",lob_id::text AS "lobId" FROM pmo_cusn.proyecto LIMIT 1`;
 const input={...source,workspaceId:workspace.id,nombre:'Proyecto documental sintético',tvt:'DRIVE-'+crypto.randomUUID(),fechaInicio:'2026-01-01',fechaTerminoBaseline:'2026-12-31',condicionComercial:{tcvTipo:'ILIMITADO',tcvValor:null,unidadCodigo:null}};
 const disabled=await data(await request('POST','proyectos',cookie,input),201);
 assert.equal((await data(await request('GET',`proyectos/${disabled.id}/drive/carpetas`,cookie))).estado,'NO_SOLICITADO');
 config.driveProvisioningEnabled=true;config.driveRootFolderId='fake-root';
 const p=await data(await request('POST','proyectos',cookie,{...input,tvt:'DRIVE-'+crypto.randomUUID()}),201);
 assert.equal((await data(await request('GET',`proyectos/${p.id}/drive/carpetas`,cookie))).estado,'PENDIENTE');
 const invalidTvt='DRIVE-ROLLBACK-'+crypto.randomUUID();assert.equal((await request('POST','proyectos',cookie,{...input,tvt:invalidTvt,especialistaIds:['9223372036854775807']})).status,422);
 const [none]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.drive_provisionamiento j JOIN pmo_cusn.proyecto p ON p.id=j.proyecto_id WHERE p.tvt=${invalidTvt}`;assert.equal(none!.n,'0');
 const adapter=new Fake();adapter.timeoutOnce=true;adapter.delay=1;
 const results=await Promise.all([provisionDrive(sql,adapter,p.id),provisionDrive(sql,adapter,p.id)]);
 assert.equal(results.filter(r=>r.estado==='COMPLETADO').length,1);assert.equal(results.filter(r=>r.estado==='SIN_CLAIM').length,1);
 assert.equal(adapter.creates,84);assert.equal(tree.nodes.length,83);
 const state=await data(await request('GET',`proyectos/${p.id}/drive/carpetas`,cookie));assert.equal(state.estado,'COMPLETADO');assert.equal(state.carpetas.length,84);
 const ids=state.carpetas.map((f:{driveId:string})=>f.driveId).sort();
 assert.equal((await provisionDrive(sql,adapter,p.id,{reverify:true})).estado,'COMPLETADO');assert.equal(adapter.creates,84);
 const again=await data(await request('GET',`proyectos/${p.id}/drive/carpetas`,cookie));assert.deepEqual(again.carpetas.map((f:{driveId:string})=>f.driveId).sort(),ids);
 const q=await data(await request('POST','proyectos',cookie,{...input,tvt:'DRIVE-'+crypto.randomUUID()}),201);
 adapter.fail=true;assert.equal((await provisionDrive(sql,adapter,q.id)).estado,'ERROR');
 const failure=await data(await request('GET',`proyectos/${q.id}/drive/carpetas`,cookie));assert.equal(failure.errorCodigo,'PERMISSION_DENIED');assert.equal((await request('GET',`proyectos/${q.id}`,cookie)).status,200);
 assert.equal((await provisionDrive(sql,adapter,q.id)).estado,'SIN_CLAIM');adapter.fail=false;
 assert.equal((await provisionDrive(sql,adapter,q.id,{retryError:true})).estado,'COMPLETADO');
 const lost=await data(await request('POST','proyectos',cookie,{...input,tvt:'DRIVE-'+crypto.randomUUID()}),201);
 await db`UPDATE pmo_cusn.drive_provisionamiento SET estado='EN_PROCESO',claim_token=gen_random_uuid(),lease_until=now()-interval '1 minute' WHERE proyecto_id=${lost.id}`;
 assert.equal((await provisionDrive(sql,adapter,lost.id)).estado,'COMPLETADO');
 const externalEmail='drive-external-'+crypto.randomUUID()+'@example.invalid';
 const [ext]=await db<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash,tipo_usuario) VALUES (${externalEmail},'Externo ensayo',${await Bun.password.hash(Bun.env.TEST_PASSWORD!,{algorithm:'argon2id'})},'EXTERNO') RETURNING id::text`;
 await db`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura) SELECT ${ext!.id},id,'ASIGNADOS' FROM pmo_cusn.rol WHERE codigo='VISUALIZADOR'`;
 const extLogin=await request('POST','sesion',undefined,{identifier:externalEmail,password:Bun.env.TEST_PASSWORD});await data(extLogin);const extCookie=extLogin.headers.getSetCookie().find(v=>v.startsWith('pmo_access='))!.split(';')[0]!;
 assert.equal((await request('GET',`proyectos/${p.id}/drive/carpetas`,extCookie)).status,403);
 assert.equal((await request('GET',`proyectos/${p.id}/drive/carpetas`)).status,401);
 await assert.rejects(()=>sql`DELETE FROM pmo_cusn.drive_carpeta WHERE proyecto_id=${p.id}`);
 await assert.rejects(()=>sql`DELETE FROM pmo_cusn.drive_provisionamiento WHERE proyecto_id=${p.id}`);
 const [root]=await db<{drive_folder_id:string}>`SELECT drive_folder_id FROM pmo_cusn.proyecto WHERE id=${p.id}`;assert.equal(root!.drive_folder_id,state.carpetas.find((f:{clave:string})=>f.clave==='ROOT').driveId);
 console.log('PASS Drive SQL/HTTP con adaptador falso: flag, intención atómica, claim concurrente, 84 nodos, timeout posterior a creación recuperado, reejecución sin duplicados, fallo permanente sin revertir proyecto, reintento explícito, lease vencido, autorización y grants sin DELETE. No acredita Drive externo.');
}finally{config.driveProvisioningEnabled=false;await db.close();await closeDatabase();}