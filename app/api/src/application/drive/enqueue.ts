import type {SQL} from 'bun';
import tree from './tree.json';
export async function enqueueDrive(tx:SQL,projectId:string,rootParentId:string){
 if(!rootParentId)throw new Error('DRIVE_ROOT_FOLDER_ID requerido al habilitar provisionamiento.');
 const [p]=await tx<{nombre:string;cliente:string}>`SELECT p.nombre,c.nombre cliente FROM pmo_cusn.proyecto p JOIN pmo_cusn.cliente c ON c.id=p.cliente_id WHERE p.id=${projectId}`;
 if(!p)throw new Error('Proyecto inexistente.');
 await tx`INSERT INTO pmo_cusn.drive_provisionamiento(proyecto_id,root_parent_id,root_name,tree_version) VALUES (${projectId},${rootParentId},${p.cliente+' – '+p.nombre},${tree.version}) ON CONFLICT(proyecto_id) DO NOTHING`;
}