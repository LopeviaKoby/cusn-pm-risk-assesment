import {SQL} from 'bun';
import {strict as assert} from 'node:assert';
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {config} from '../src/config';
import {provisionDrive} from '../src/application/drive/provision';
import {createGoogleDriveAdapter} from '../src/infrastructure/drive/google';
import tree from '../src/application/drive/tree.json';
if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_')||!process.argv.includes('--allow-test-tree'))throw new Error('Solo ensayo explícito en BD aislada.');
const b0=JSON.parse(readFileSync('.tools/drive-b0/result.json','utf8')) as {status:string;testId:string};
if(b0.status!=='EXITO'||!b0.testId)throw new Error('B0 real exitoso requerido.');
const key=Bun.env.GOOGLE_APPLICATION_CREDENTIALS??Bun.env.DRIVE_SA;if(!key)throw new Error('Ruta SA requerida.');
const adapter=createGoogleDriveAdapter(key);
const parent=await adapter.get(b0.testId);assert.ok(parent.parents.includes(config.driveRootFolderId),'El ensayo B0 debe estar bajo raíz configurada');
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});const {sql,closeDatabase}=await import('../src/db');const {handleRequest}=await import('../src/index');
const evidenceFile='.tools/drive-b1/result.json';mkdirSync('.tools/drive-b1',{recursive:true});
const artifact:{database:string;projectId?:string;estado:string;rootId?:string;sourceSha256:string;created?:number;verified?:number;secondCreated?:number}={database:new URL(Bun.env.TEST_DATABASE_URL!).pathname,estado:'EN_PROCESO',sourceSha256:tree.sourceSha256};
try {
 config.driveProvisioningEnabled=true;config.driveRootFolderId=b0.testId;
 const request=(method:string,path:string,cookie?:string,body?:unknown)=>handleRequest(new Request('http://127.0.0.1/api/v1/'+path,{method,headers:{origin:'http://127.0.0.1:4173',...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));
 async function data(r:Response,status=200){const b=await r.json();assert.equal(r.status,status,JSON.stringify(b));return b.data;}
 if(existsSync(evidenceFile)){const prior=JSON.parse(readFileSync(evidenceFile,'utf8')) as typeof artifact;if(prior.database===artifact.database)artifact.projectId=prior.projectId;}
 if(!artifact.projectId){
  const password=crypto.randomUUID()+crypto.randomUUID(),email=`drive-e2e-${crypto.randomUUID()}@example.invalid`,hash=await Bun.password.hash(password,{algorithm:'argon2id'});
  const [actor]=await db<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash) VALUES (${email},'PM ENSAYO DRIVE',${hash}) RETURNING id::text`;
  await db`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura) SELECT ${actor!.id},id,'GLOBAL' FROM pmo_cusn.rol WHERE codigo='PM'`;
  const login=await request('POST','sesion',undefined,{identifier:email,password});await data(login);const cookie=login.headers.getSetCookie().find(c=>c.startsWith('pmo_access='))!.split(';')[0]!;
  const w=await data(await request('POST','workspaces',cookie,{nombre:'ENSAYO DRIVE '+crypto.randomUUID()}),201);
  const c=await data(await request('POST','clientes',cookie,{nombre:'CLIENTE ENSAYO',estadoCliente:'NUEVO'}),201);
  const [refs]=await db<{pais:string;lob:string}>`SELECT (SELECT id::text FROM pmo_cusn.pais WHERE activo LIMIT 1) pais,(SELECT id::text FROM pmo_cusn.lob WHERE activo LIMIT 1) lob`;
  const p=await data(await request('POST','proyectos',cookie,{workspaceId:w.id,clienteId:c.id,paisId:refs!.pais,lobId:refs!.lob,tvt:'DRIVE-E2E-'+crypto.randomUUID(),nombre:'PROYECTO ENSAYO '+crypto.randomUUID(),fechaInicio:'2026-01-01',fechaTerminoBaseline:'2026-12-31',condicionComercial:{tcvTipo:'ILIMITADO',tcvValor:null,unidadCodigo:null}}),201);
  artifact.projectId=p.id;writeFileSync(evidenceFile,JSON.stringify(artifact,null,2));
 }
 const project=artifact.projectId!;let creates=0;
 const counted={...adapter,create:async(...args:Parameters<typeof adapter.create>)=>{const r=await adapter.create(...args);creates++;if(creates%20===0)console.log(`Ensayo Drive: ${creates} carpetas creadas`);return r;}};
 assert.equal((await provisionDrive(sql,counted,project,{retryError:true,reverify:true})).estado,'COMPLETADO');
 const before=await db<{clave_nodo:string;drive_id:string;parent_drive_id:string}>`SELECT clave_nodo,drive_id,parent_drive_id FROM pmo_cusn.drive_carpeta WHERE proyecto_id=${project} ORDER BY clave_nodo`;
 assert.equal(before.length,84);assert.equal(new Set(before.map(f=>f.drive_id)).size,84);
 artifact.created=creates;
 const [job]=await db<{remote_key:string}>`SELECT remote_key::text FROM pmo_cusn.drive_provisionamiento WHERE proyecto_id=${project}`;
 for(const f of before){const matches=await adapter.find(f.parent_drive_id,job!.remote_key,f.clave_nodo);assert.equal(matches.length,1);assert.equal(matches[0]!.id,f.drive_id);}
 assert.equal((await provisionDrive(sql,counted,project,{reverify:true})).estado,'COMPLETADO');
 artifact.secondCreated=creates-artifact.created;assert.equal(artifact.secondCreated,0);
 const after=await db<{clave_nodo:string;drive_id:string;parent_drive_id:string}>`SELECT clave_nodo,drive_id,parent_drive_id FROM pmo_cusn.drive_carpeta WHERE proyecto_id=${project} ORDER BY clave_nodo`;
 assert.deepEqual(after,before);artifact.estado='COMPLETADO';artifact.verified=84;artifact.rootId=before.find(f=>f.clave_nodo==='ROOT')!.drive_id;
 writeFileSync(evidenceFile,JSON.stringify(artifact,null,2));console.log(JSON.stringify(artifact,null,2));
}catch{artifact.estado='ERROR';writeFileSync(evidenceFile,JSON.stringify(artifact,null,2));console.error('DRIVE_E2E_FAILED: detalle remoto no impreso para proteger credenciales.');process.exitCode=1;}
finally{await db.close();await closeDatabase();}