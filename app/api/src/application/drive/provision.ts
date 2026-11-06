import type {SQL} from 'bun';
import tree from './tree.json';
import {DriveFailure,type DriveAdapter,type DriveFolder} from './adapter';
type Job={remote_key:string;root_parent_id:string;root_name:string;tree_version:string;intentos:number};
export async function provisionDrive(db:SQL,adapter:DriveAdapter,projectId:string,options:{retryError?:boolean;reverify?:boolean}={}){
 const token=crypto.randomUUID();
 const job=await db.begin(async tx=>{
  const [row]=await tx<Job>`UPDATE pmo_cusn.drive_provisionamiento SET estado='EN_PROCESO',claim_token=${token}::uuid,lease_until=now()+interval '10 minutes',intentos=intentos+1,error_codigo=NULL,next_attempt_at=NULL,updated_at=now()
   WHERE proyecto_id=${projectId} AND (estado='PENDIENTE' OR (estado='EN_PROCESO' AND lease_until<now()) OR (estado='ERROR' AND (${!!options.retryError} OR (next_attempt_at<=now() AND intentos<5))) OR (estado='COMPLETADO' AND ${!!options.reverify})) RETURNING remote_key::text,root_parent_id,root_name,tree_version,intentos`;
  return row;
 });
 if(!job)return {estado:'SIN_CLAIM'};
 const heartbeat=async()=>{
  const r=await db`UPDATE pmo_cusn.drive_provisionamiento SET lease_until=now()+interval '10 minutes',updated_at=now() WHERE proyecto_id=${projectId} AND claim_token=${token}::uuid AND estado='EN_PROCESO' RETURNING proyecto_id`;
  if(!r.length)throw new DriveFailure('CLAIM_LOST');
 };
 const nodes=[{key:'ROOT',parent:null as string|null,name:job.root_name},...tree.nodes];
 const ids=new Map<string,string>(),paths=new Map<string,string>();
 let currentKey:string|null=null;
 try {
  if(job.tree_version!==tree.version)throw new DriveFailure('TREE_VERSION_MISMATCH');
  for(const node of nodes){
   currentKey=node.key;
   await heartbeat();
   const parent=node.parent===null?job.root_parent_id:ids.get(node.parent);
   if(!parent)throw new DriveFailure('TREE_PARENT_MISSING');
   const path=node.parent===null?node.name:paths.get(node.parent)+'/'+node.name;
   const [saved]=await db<{drive_id:string}>`SELECT drive_id FROM pmo_cusn.drive_carpeta WHERE proyecto_id=${projectId} AND clave_nodo=${node.key}`;
   let folder:DriveFolder|undefined;
   if(saved){
    try{folder=await adapter.get(saved.drive_id);}catch(e){if(!(e instanceof DriveFailure)||e.code!=='NOT_FOUND')throw e;}
   }
   if(!folder){
    const found=await adapter.find(parent,job.remote_key,node.key);
    if(found.length>1)throw new DriveFailure('DUPLICATE_REMOTE_NODE');
    folder=found[0];
    if(!folder){
     // The durable node key survives timeout after creation. On uncertainty reconcile before retrying.
     await heartbeat();
     try{folder=await adapter.create(parent,node.name,job.remote_key,node.key);}
     catch(e){
      const recovered=await adapter.find(parent,job.remote_key,node.key);
      if(recovered.length!==1)throw e;
      folder=recovered[0]!;
     }
    }
    folder=await adapter.get(folder.id);
   }
   if(folder.trashed||folder.mimeType!=='application/vnd.google-apps.folder'||folder.name!==node.name||!folder.parents.includes(parent)||folder.appProperties.pmoJob!==job.remote_key||folder.appProperties.pmoNode!==node.key)throw new DriveFailure('REMOTE_NODE_MISMATCH');
   await db.begin(async tx=>{
    const [active]=await tx`SELECT proyecto_id FROM pmo_cusn.drive_provisionamiento WHERE proyecto_id=${projectId} AND claim_token=${token}::uuid FOR UPDATE`;
    if(!active)throw new DriveFailure('CLAIM_LOST');
    await tx`INSERT INTO pmo_cusn.drive_carpeta(proyecto_id,clave_nodo,drive_id,parent_drive_id,ruta) VALUES (${projectId},${node.key},${folder!.id},${parent},${path}) ON CONFLICT(proyecto_id,clave_nodo) DO UPDATE SET drive_id=excluded.drive_id,parent_drive_id=excluded.parent_drive_id,ruta=excluded.ruta,checked_at=now(),error_codigo=NULL`;
    if(node.key==='ROOT')await tx`UPDATE pmo_cusn.proyecto SET drive_folder_id=${folder!.id} WHERE id=${projectId}`;
   });
   ids.set(node.key,folder.id);paths.set(node.key,path);
  }
  await db.begin(async tx=>{
   const result=await tx`UPDATE pmo_cusn.drive_provisionamiento SET estado='COMPLETADO',claim_token=NULL,lease_until=NULL,error_codigo=NULL,updated_at=now() WHERE proyecto_id=${projectId} AND claim_token=${token}::uuid RETURNING proyecto_id`;
   if(!result.length)throw new DriveFailure('CLAIM_LOST');
   await tx`INSERT INTO pmo_cusn.auditoria_seguridad(proyecto_id,operacion,recurso_tipo,recurso_id,resultado,detalle) VALUES (${projectId},'drive.provisionar','proyecto',${projectId},'PERMITIDO',${{ejecutor:'drive-worker',carpetas:ids.size}}::jsonb)`;
  });
  return {estado:'COMPLETADO',carpetas:ids.size};
 }catch(e){
  const failure=e instanceof DriveFailure?e:new DriveFailure('PROVISIONING_FAILED');
  const retry=failure.transient&&job.intentos<5;
  const delay=Math.min(3600,30*2**Math.min(job.intentos,7));
  await db`UPDATE pmo_cusn.drive_carpeta SET error_codigo=${failure.code} WHERE proyecto_id=${projectId} AND clave_nodo=${currentKey} AND EXISTS(SELECT 1 FROM pmo_cusn.drive_provisionamiento WHERE proyecto_id=${projectId} AND claim_token=${token}::uuid)`;
  await db`UPDATE pmo_cusn.drive_provisionamiento SET estado='ERROR',claim_token=NULL,lease_until=NULL,error_codigo=${failure.code},next_attempt_at=CASE WHEN ${retry} THEN now()+${delay}*interval '1 second' ELSE NULL END,updated_at=now() WHERE proyecto_id=${projectId} AND claim_token=${token}::uuid`;
  return {estado:'ERROR',errorCodigo:failure.code};
 }
}