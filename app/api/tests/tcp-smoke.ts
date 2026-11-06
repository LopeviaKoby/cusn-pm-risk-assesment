import {strict as assert} from 'node:assert';
import {spawn} from 'node:child_process';
import {SQL} from 'bun';
if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const port=44000+Math.floor(Math.random()*10000);
const base=`http://127.0.0.1:${port}/api/v1/`;
const child=spawn(process.execPath,['app/api/src/index.ts'],{env:{...process.env,API_HOST:'127.0.0.1',API_PORT:String(port)},stdio:['ignore','pipe','pipe']});
let diagnostic='';child.stdout.on('data',chunk=>diagnostic+=String(chunk));child.stderr.on('data',chunk=>diagnostic+=String(chunk));
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const request=(method:string,path:string,cookie?:string,body?:unknown)=>fetch(base+path,{method,headers:{origin:'http://127.0.0.1:4173',...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
try{
  let ready=false;
  for(let i=0;i<100;i++){
    if(child.exitCode!==null)throw new Error(`API terminó: ${diagnostic}`);
    try{ready=(await request('GET','salud')).ok;}catch{}
    if(ready)break;await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.ok(ready,diagnostic);
  assert.equal((await request('GET','listo')).status,200);
  assert.equal((await request('GET','sesion')).status,401);
  const auth=await request('POST','sesion',undefined,{identifier:'pm-workspace@example.invalid',password:Bun.env.TEST_PASSWORD});
  assert.equal(auth.status,200,diagnostic+'\n'+await auth.clone().text());
  const cookies=auth.headers.getSetCookie().map(value=>value.split(';')[0]!).join('; ');
  assert.ok(cookies.includes('pmo_access=')&&cookies.includes('pmo_refresh='));
  const workspace=await request('POST','workspaces',cookies,{nombre:`TCP ${crypto.randomUUID()}`});
  assert.equal(workspace.status,201);
  const wid=(await workspace.json()).data.id as string;
  const [catalog]=await db`SELECT cliente_id::text AS "clienteId",pais_id::text AS "paisId",lob_id::text AS "lobId" FROM pmo_cusn.proyecto LIMIT 1`;
  const created=await request('POST','proyectos',cookies,{...catalog,workspaceId:wid,tvt:`TCP-${crypto.randomUUID()}`,nombre:'Recorrido TCP'});
  assert.equal(created.status,201);
  const project=(await created.json()).data as {id:string;version:string};
  assert.equal((await request('GET',`proyectos/${project.id}`,cookies)).status,200);
  assert.equal((await request('PATCH',`proyectos/${project.id}`,cookies,{version:project.version,nombre:'Guardado TCP'})).status,200);
  assert.equal((await request('DELETE','sesion',cookies)).status,200);
  assert.equal((await request('GET','sesion',cookies)).status,401);
  console.log(`PASS TCP loopback PID=${child.pid} puerto=${port}: salud/listo, login, workspace, proyecto, lectura, edición y logout.`);
}finally{
  child.kill();await db.close();
  if(child.exitCode===null)await new Promise(resolve=>child.once('exit',resolve));
}
